import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwtSecret: process.env.JWT_SECRET || 'repp_super_secret_jwt_key_2026_change_in_production',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaTextModel: process.env.OLLAMA_TEXT_MODEL || 'llama3.1:8b',
  ollamaVisionModel: process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision',
  ollamaTimeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000', 10),
  // How long Ollama keeps a model in memory after a request (avoids slow reloads). e.g. '30m', '-1' = forever.
  ollamaKeepAlive: process.env.OLLAMA_KEEP_ALIVE || '30m',
  // Context window in tokens. Smaller = less memory and slightly faster on CPU; must fit the longest prompt.
  ollamaNumCtx: parseInt(process.env.OLLAMA_NUM_CTX || '4096', 10),
  // Cloud AI (Anthropic). When set, chat, meal logging and plans use Claude; BodyVision stays on Ollama.
  anthropicApiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
  claudeModel: process.env.CLAUDE_MODEL || 'claude-haiku-5-5',
  // Account the "Try the demo" button signs into (shared by all visitors). Empty = button disabled.
  demoEmail: (process.env.DEMO_EMAIL ?? 'demo3m@repp.app').trim().toLowerCase(),
  // Vercel's disk is read-only except the temp folder, so uploads go there (kept only briefly).
  uploadDir: path.resolve(process.env.UPLOAD_DIR || (process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : './uploads')),
  // OAuth client ID from Google Cloud Console (public, not a secret). Empty = Google sign-in disabled.
  googleClientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  // Body progress photos: never served statically, only via the authenticated photo route.
  privateUploadDir: path.resolve(process.env.PRIVATE_UPLOAD_DIR || (process.env.VERCEL ? path.join(os.tmpdir(), 'private_uploads') : './private_uploads')),
  // Where BodyVision body photos are analysed: 'ollama' (own server, private) or 'claude' (cloud, needed when hosted without Ollama).
  bodyVisionAi: (process.env.BODYVISION_AI || 'ollama').toLowerCase(),
};
