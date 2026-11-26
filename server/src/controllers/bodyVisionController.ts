import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { aiService } from '../ai/aiService.js';
import { buildBodyVisionPrompt } from '../ai/prompts/bodyVisionPrompt.js';
import { evaluateUserBadges } from '../utils/badgeEvaluator.js';
import { config } from '../config.js';

const prisma = new PrismaClient();

export async function getReports(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const reports = await prisma.bodyVisionReport.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ reports });
}

const PHOTO_URL_PREFIX = '/api/bodyvision/photo/';

// Accepts things like "16.5% - 18.2%", "16.5-18.2", "about 17%". Returns null if not plausible.
function normaliseBodyFatRange(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const nums = String(value).match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length === 0) return null;
  let low = nums[0];
  let high = nums.length > 1 ? nums[1] : nums[0];
  if (low > high) [low, high] = [high, low];
  if (low < 3 || high > 60) return null;
  if (low === high) {
    low = Math.max(3, low - 1);
    high = high + 1;
  }
  return `${low.toFixed(1)}% - ${high.toFixed(1)}%`;
}

function asText(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string').join(' ') || fallback;
  return fallback;
}

function removeFiles(files: Express.Multer.File[]): void {
  for (const f of files) fs.unlink(f.path, () => {});
}

export async function uploadAndAnalyze(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const files = (req.files as { [fieldname: string]: Express.Multer.File[] } | undefined) || {};

  const front = files.front?.[0];
  const side = files.side?.[0];
  const back = files.back?.[0];
  const uploaded = [front, side, back].filter((f): f is Express.Multer.File => Boolean(f));

  if (!front) {
    removeFiles(uploaded);
    res.status(400).json({ error: 'A front-view photo is required. Side and back views are optional.' });
    return;
  }

  const base64Images = uploaded.map(f => fs.readFileSync(f.path).toString('base64'));

  // Get previous report for comparison
  const previousReport = await prisma.bodyVisionReport.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  let analysisResult: any = null;
  let failureReason = '';
  try {
    const { system, prompt } = buildBodyVisionPrompt(previousReport?.estimatedBodyFatRange);
    analysisResult = await aiService.generateStructured<any>(prompt, system, undefined, undefined, base64Images, { task: 'bodyvision', maxTokens: 450, localOnly: true });
  } catch (err: any) {
    failureReason = err.message;
    console.log('AI BodyVision analysis failed:', err.message);
  }

  if (analysisResult && analysisResult.isHumanPhysique === false) {
    removeFiles(uploaded);
    res.status(422).json({
      error: `No body detected in the front photo${analysisResult.reason ? ` (${String(analysisResult.reason).trim().replace(/\.$/, '')})` : ''}. Please upload a clear, well-lit photo showing your torso.`
    });
    return;
  }

  const range = analysisResult?.isHumanPhysique === true
    ? normaliseBodyFatRange(
        analysisResult.bodyFatLow != null && analysisResult.bodyFatHigh != null
          ? `${analysisResult.bodyFatLow} - ${analysisResult.bodyFatHigh}`
          : analysisResult.estimatedBodyFatRange
      )
    : null;
  if (!range) {
    // Don't invent a body-fat number: delete the photos and tell the user.
    removeFiles(uploaded);
    res.status(503).json({
      error: failureReason.includes('offline')
        ? 'Body photo analysis is not available right now. Please try again later.'
        : "The AI couldn't estimate body fat from these photos. Try a clearer, well-lit, full-torso photo and upload again.",
      aiUnavailable: true
    });
    return;
  }

  const dateFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const toUrl = (f?: Express.Multer.File) => (f ? `${PHOTO_URL_PREFIX}${f.filename}` : null);

  const newReport = await prisma.bodyVisionReport.create({
    data: {
      userId,
      date: dateFormatted,
      frontPhotoPath: toUrl(front),
      sidePhotoPath: toUrl(side),
      backPhotoPath: toUrl(back),
      estimatedBodyFatRange: range,
      fatDistribution: asText(analysisResult.fatDistribution, 'No distribution notes returned.'),
      visibleTrends: asText(analysisResult.visibleTrends, 'No trend notes returned.'),
      comparisonWithPrevious: previousReport
        ? asText(analysisResult.comparisonWithPrevious, `Compared with previous scan on ${previousReport.date}.`)
        : 'Baseline scan recorded.',
      disclaimer: asText(
        analysisResult.disclaimer,
        'AI optical estimation for progress tracking, not a clinical DEXA scan.'
      )
    }
  });

  const newBadges = await evaluateUserBadges(prisma, userId);

  res.status(201).json({
    report: newReport,
    newBadges
  });
}

export async function servePrivatePhoto(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const filename = req.params.filename as string;

  // Ensure safe filename without path traversal
  const sanitized = path.basename(filename);
  const privatePath = path.join(config.privateUploadDir, sanitized);
  const filePath = fs.existsSync(privatePath) ? privatePath : path.join(config.uploadDir, sanitized);

  // Check if this photo belongs to this user's reports
  const report = await prisma.bodyVisionReport.findFirst({
    where: {
      userId,
      OR: [
        { frontPhotoPath: { contains: sanitized } },
        { sidePhotoPath: { contains: sanitized } },
        { backPhotoPath: { contains: sanitized } }
      ]
    }
  });

  if (!report) {
    res.status(403).json({ error: 'Access denied: Photo does not belong to your account' });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }

  res.sendFile(filePath);
}

export async function deleteAllPhotos(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const reports = await prisma.bodyVisionReport.findMany({ where: { userId } });

  for (const r of reports) {
    for (const p of [r.frontPhotoPath, r.sidePhotoPath, r.backPhotoPath]) {
      if (p && p.startsWith('/api/bodyvision/photo/')) {
        const filename = path.basename(p);
        for (const dir of [config.privateUploadDir, config.uploadDir]) {
          const fullPath = path.join(dir, filename);
          if (fs.existsSync(fullPath)) {
            try { fs.unlinkSync(fullPath); } catch {}
          }
        }
      }
    }
  }

  await prisma.bodyVisionReport.deleteMany({ where: { userId } });

  res.json({ message: 'All progress photos and reports erased permanently from storage and database.' });
}
