import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

/** Work out an image's type from the first bytes of its base64 data. */
function mediaTypeOf(base64: string): ImageMediaType {
  if (base64.startsWith('iVBOR')) return 'image/png';
  if (base64.startsWith('UklGR')) return 'image/webp';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  return 'image/jpeg';
}

/** Pull the JSON object out of a reply, tolerating ```json fences or a sentence around it. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.search(/[{[]/);
  const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));
  return start !== -1 && end > start ? body.slice(start, end + 1) : body.trim();
}

/**
 * Claude (Anthropic API) backend. Same method shapes as OllamaService so callers don't change.
 * Thinking stays on (Haiku 5.5 default) at low effort: quick answers, the model can still reason on harder plans.
 */
export class ClaudeService {
  private client: Anthropic;
  readonly model: string;

  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey, timeout: config.ollamaTimeoutMs, maxRetries: 2 });
    this.model = config.claudeModel;
  }

  private logUsage(task: string, started: number, msg: Anthropic.Message): void {
    const u = msg.usage;
    console.log(`[ai] ${task} (${this.model}): read ${u.input_tokens} tok, wrote ${u.output_tokens} tok, total ${((Date.now() - started) / 1000).toFixed(1)}s${msg.stop_reason === 'max_tokens' ? ' [hit length cap]' : ''}`);
  }

  // Room for thinking plus the answer; local caps were sized for a slow CPU, not for Claude.
  private budget(maxTokens?: number): number {
    return Math.max(2048, (maxTokens ?? 1200) * 3);
  }

  async generateStructured<T>(
    prompt: string,
    systemPrompt: string,
    _schema?: object,
    _modelOverride?: string,
    images?: string[],
    opts: { maxTokens?: number; task?: string } = {}
  ): Promise<T> {
    const content: Anthropic.ContentBlockParam[] = [
      ...(images || []).map(data => ({
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: mediaTypeOf(data), data }
      })),
      { type: 'text', text: `${prompt}\n\nReply with only the JSON object, no markdown and no other text.` }
    ];

    const ask = async (messages: Anthropic.MessageParam[]): Promise<string> => {
      const started = Date.now();
      const msg = await this.client.messages.create({
        model: this.model,
        max_tokens: this.budget(opts.maxTokens),
        output_config: { effort: 'low' },
        system: systemPrompt,
        messages
      });
      this.logUsage(opts.task || 'structured', started, msg);
      if (msg.stop_reason === 'refusal') throw new Error('The AI declined this request.');
      if (msg.stop_reason === 'max_tokens') {
        throw Object.assign(new Error('AI answer was too long and got cut off'), { name: 'LengthError' });
      }
      return msg.content.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('');
    };

    const first = await ask([{ role: 'user', content }]);
    try {
      return JSON.parse(extractJson(first)) as T;
    } catch {
      // One repair attempt: show the model its own output and ask for valid JSON only.
      const second = await ask([
        { role: 'user', content },
        { role: 'assistant', content: first },
        { role: 'user', content: 'That was not valid JSON. Reply again with only the corrected JSON object.' }
      ]);
      try {
        return JSON.parse(extractJson(second)) as T;
      } catch (err: any) {
        throw new Error(`AI structured generation failed after retry: ${err.message}`);
      }
    }
  }

  async chatStream(messages: ChatMessage[], onChunk: (chunk: string) => void, signal?: AbortSignal): Promise<string> {
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const turns: Anthropic.MessageParam[] = messages
      .filter((m): m is ChatMessage & { role: 'user' | 'assistant' } => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const started = Date.now();
    let full = '';
    const stream = this.client.messages.stream(
      { model: this.model, max_tokens: 2048, output_config: { effort: 'low' }, system, messages: turns },
      { signal }
    );
    stream.on('text', (text) => {
      full += text;
      onChunk(text);
    });
    const final = await stream.finalMessage();
    this.logUsage('chat', started, final);
    if (final.stop_reason === 'refusal' && !full) throw new Error('The AI declined this request.');
    return full;
  }
}

export const claudeService = config.anthropicApiKey ? new ClaudeService() : null;
