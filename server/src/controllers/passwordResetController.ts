/**
 * Forgot password: email a 6-digit code, then let the user set a new password with it.
 * Codes expire after 15 minutes, allow 5 attempts, and only their hash is stored.
 */
import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../utils/mailer.js';
import { isDemoEmail } from '../middleware/blockDemo.js';

const prisma = new PrismaClient();

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const GENERIC_SENT = 'If an account exists for this email, we have sent a 6-digit code to it. Check your inbox and spam folder.';
const INVALID_CODE = 'That code is incorrect or has expired. Check the latest email, or request a new code.';

const hashCode = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

const requestSchema = z.object({ email: z.string().email('Enter a valid email address') });
const resetSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from the email'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters')
});

export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const email = requestSchema.parse(req.body).email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });

  // Same answer whether or not the account exists, so the form can't be used to discover who has an account.
  if (!user || isDemoEmail(email)) {
    res.json({ message: GENERIC_SENT });
    return;
  }

  const recent = await prisma.passwordReset.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    res.status(429).json({ error: 'A code was just sent. Please wait a minute before asking for another.' });
    return;
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } }); // only the newest code works
  await prisma.passwordReset.create({
    data: { userId: user.id, codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) }
  });

  const name = user.profile?.name?.split(' ')[0] || 'there';
  try {
    await sendEmail(
      email,
      `${code} is your REPP password reset code`,
      `Hi ${name},\n\nYour REPP password reset code is ${code}. It expires in 15 minutes.\n\nIf you didn't ask to reset your password, you can ignore this email; your password won't change.\n\nREPP`,
      `<div style="font-family:Arial,sans-serif;color:#1C1C1C;max-width:480px">
        <p>Hi ${name},</p>
        <p>Your REPP password reset code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#2F4F3E;margin:16px 0">${code}</p>
        <p>It expires in 15 minutes.</p>
        <p style="color:#6B6B6B;font-size:13px">If you didn't ask to reset your password, you can ignore this email; your password won't change.</p>
      </div>`
    );
  } catch (err: any) {
    console.error('[mail] password reset email failed:', err.message);
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
    res.status(503).json({ error: "We couldn't send the email right now. Please try again in a few minutes." });
    return;
  }

  res.json({ message: GENERIC_SENT });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetSchema.parse(req.body);
  const email = parsed.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  const reset = user
    ? await prisma.passwordReset.findFirst({ where: { userId: user.id, usedAt: null }, orderBy: { createdAt: 'desc' } })
    : null;

  if (!user || !reset || reset.expiresAt.getTime() < Date.now() || reset.attempts >= MAX_ATTEMPTS) {
    res.status(400).json({ error: INVALID_CODE });
    return;
  }

  const expected = Buffer.from(reset.codeHash, 'hex');
  const given = Buffer.from(hashCode(parsed.code), 'hex');
  if (!crypto.timingSafeEqual(expected, given)) {
    const attempts = reset.attempts + 1;
    await prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts } });
    res.status(400).json({
      error: attempts >= MAX_ATTEMPTS ? 'Too many wrong codes. Please request a new code.' : INVALID_CODE
    });
    return;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.newPassword, 10) } }),
    prisma.passwordReset.deleteMany({ where: { userId: user.id } })
  ]);

  res.json({ message: 'Your password has been changed. You can now log in with your new password.' });
}
