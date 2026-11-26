import { Request, Response } from 'express';
import { ollamaService } from '../ai/ollamaService.js';
import { config } from '../config.js';
import { aiService } from '../ai/aiService.js';

export async function getAiHealth(_req: Request, res: Response): Promise<void> {
  const health = await ollamaService.checkHealth();

  res.json({
    ...health,
    // Text and meal features run on Claude when configured; Ollama then only serves BodyVision.
    provider: aiService.provider,
    textOnline: aiService.provider === 'claude' || health.online,
    configuredCloudModel: aiService.provider === 'claude' ? config.claudeModel : null,
    bodyVisionProvider: config.bodyVisionAi === 'claude' && aiService.provider === 'claude' ? 'claude' : 'ollama',
    configuredTextModel: config.ollamaTextModel,
    configuredVisionModel: config.ollamaVisionModel,
    pullInstructions: {
      text: `ollama pull ${config.ollamaTextModel}`,
      vision: `ollama pull ${config.ollamaVisionModel}`
    }
  });
}
