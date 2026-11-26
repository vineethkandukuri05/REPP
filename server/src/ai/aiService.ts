import { claudeService } from './claudeService.js';
import { ollamaService } from './ollamaService.js';
import { config } from '../config.js';

/**
 * Picks the AI backend per request. With ANTHROPIC_API_KEY set, text and meal photos go to Claude;
 * anything marked `localOnly` (BodyVision body photos) stays on Ollama unless BODYVISION_AI=claude.
 * Without a key everything runs on Ollama, as before.
 */
export const aiService = {
  get provider(): 'claude' | 'ollama' {
    return claudeService ? 'claude' : 'ollama';
  },

  get textModelName(): string {
    return claudeService ? claudeService.model : ollamaService.textModelName;
  },

  generateStructured<T>(
    prompt: string,
    systemPrompt: string,
    schema?: object,
    modelOverride?: string,
    images?: string[],
    opts: { maxTokens?: number; task?: string; localOnly?: boolean } = {}
  ): Promise<T> {
    const stayLocal = opts.localOnly && config.bodyVisionAi !== 'claude';
    const backend = claudeService && !stayLocal ? claudeService : ollamaService;
    return backend.generateStructured<T>(prompt, systemPrompt, schema, modelOverride, images, opts);
  },

  chatStream(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    return (claudeService ?? ollamaService).chatStream(messages, onChunk, signal);
  }
};
