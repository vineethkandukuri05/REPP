import './utils/asyncErrors.js';
import { PrismaClient } from '@prisma/client';
import app from './app.js';
import { config } from './config.js';
import { ollamaService } from './ai/ollamaService.js';
import { aiService } from './ai/aiService.js';
import { scheduleDailyDemoReset } from './utils/demoReset.js';

// Local / long-running server. On Vercel, api/index.js serves the same app without listen().
const port = config.port;

app.listen(port, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 REPP AI Backend Server listening on http://localhost:${port}`);
  console.log(`   Configured Client Origin: ${config.clientOrigin}`);
  console.log(`   AI for text and meals:    ${aiService.provider === 'claude' ? `Claude (${config.claudeModel})` : `Ollama (${config.ollamaTextModel})`}`);
  console.log(`   AI for BodyVision:        ${config.bodyVisionAi === 'claude' && aiService.provider === 'claude' ? `Claude (${config.claudeModel})` : `Ollama (${config.ollamaVisionModel})`}`);
  console.log(`=======================================================`);

  // Restore the shared demo account to its clean copy once a day.
  scheduleDailyDemoReset(new PrismaClient());

  // Check Ollama health on startup
  try {
    const health = await ollamaService.checkHealth();
    if (health.online) {
      console.log(`✅ Ollama AI server connected (${health.models.length} models available).`);
      // Load the models now so the first user request doesn't wait for them.
      ollamaService.warmUp();
    } else {
      console.log(`⚠️  Ollama AI server is offline. Standard features will run in manual/rule mode.`);
      console.log(`   To activate full local AI, start Ollama and run:`);
      console.log(`   ollama pull ${config.ollamaTextModel}`);
      console.log(`   ollama pull ${config.ollamaVisionModel}`);
    }
  } catch (err: any) {
    console.log(`⚠️  Could not reach Ollama:`, err.message);
  }
});
