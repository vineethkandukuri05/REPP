import { config } from '../config.js';

export interface OllamaHealth {
  online: boolean;
  models: string[];
  hasTextModel: boolean;
  hasVisionModel: boolean;
  message?: string;
}

export class OllamaService {
  private baseUrl: string;
  private textModel: string;
  private visionModel: string;
  private timeoutMs: number;
  private keepAlive: string | number;
  private numCtx: number;

  constructor() {
    this.baseUrl = config.ollamaBaseUrl;
    this.textModel = config.ollamaTextModel;
    this.visionModel = config.ollamaVisionModel;
    this.timeoutMs = config.ollamaTimeoutMs;
    this.keepAlive = /^-?\d+$/.test(config.ollamaKeepAlive) ? Number(config.ollamaKeepAlive) : config.ollamaKeepAlive;
    this.numCtx = config.ollamaNumCtx;
  }

  get textModelName(): string { return this.textModel; }
  get visionModelName(): string { return this.visionModel; }

  /** Load models into memory ahead of the first request, so users don't wait for a cold start. */
  async warmUp(): Promise<void> {
    const models = [...new Set([this.textModel, this.visionModel])];
    for (const model of models) {
      try {
        const started = Date.now();
        // An empty prompt just loads the model and keeps it resident for keep_alive.
        await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt: '', keep_alive: this.keepAlive, options: { num_ctx: this.numCtx } }),
          signal: AbortSignal.timeout(180000)
        });
        console.log(`[ai] ${model} loaded and kept in memory (${((Date.now() - started) / 1000).toFixed(1)}s)`);
      } catch (err: any) {
        console.log(`[ai] could not preload ${model}: ${err.message}`);
      }
    }
  }

  private logTiming(task: string, model: string, d: any): void {
    if (!d || typeof d.total_duration !== 'number') return;
    const s = (ns: number) => (ns / 1e9).toFixed(1);
    console.log(`[ai] ${task} (${model}): read ${d.prompt_eval_count ?? 0} tok in ${s(d.prompt_eval_duration ?? 0)}s, wrote ${d.eval_count ?? 0} tok in ${s(d.eval_duration ?? 0)}s, load ${s(d.load_duration ?? 0)}s, total ${s(d.total_duration)}s${d.done_reason === 'length' ? ' [hit length cap]' : ''}`);
  }

  async checkHealth(): Promise<OllamaHealth> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          online: false,
          models: [],
          hasTextModel: false,
          hasVisionModel: false,
          message: `Ollama returned status ${res.status}`
        };
      }

      const data = await res.json() as { models?: Array<{ name: string }> };
      const modelNames = (data.models || []).map(m => m.name);

      const hasTextModel = modelNames.some(m => m.includes(this.textModel.split(':')[0]));
      const hasVisionModel = modelNames.some(m => m.includes(this.visionModel.split(':')[0]));

      return {
        online: true,
        models: modelNames,
        hasTextModel,
        hasVisionModel
      };
    } catch (err: any) {
      return {
        online: false,
        models: [],
        hasTextModel: false,
        hasVisionModel: false,
        message: err.message || 'Cannot connect to local Ollama instance'
      };
    }
  }

  async generateStructured<T>(
    prompt: string,
    systemPrompt: string,
    schema?: object,
    modelOverride?: string,
    images?: string[],
    opts: { maxTokens?: number; task?: string } = {}
  ): Promise<T> {
    const model = modelOverride || (images && images.length > 0 ? this.visionModel : this.textModel);

    const callApi = async (promptText: string): Promise<string> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const payload: any = {
          model,
          prompt: promptText,
          system: systemPrompt,
          stream: false,
          format: schema ? schema : 'json',
          keep_alive: this.keepAlive,
          options: {
            temperature: 0.2,
            num_ctx: this.numCtx,
            // Cap the answer length so a runaway response can't take minutes.
            num_predict: opts.maxTokens ?? 1200
          }
        };

        if (images && images.length > 0) {
          payload.images = images;
        }

        const res = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Ollama generation failed: HTTP ${res.status} ${res.statusText}`);
        }

        const data = await res.json() as { response: string; done_reason?: string };
        this.logTiming(opts.task || 'structured', model, data);
        if (data.done_reason === 'length') {
          // Cut off at the cap: the JSON is incomplete, and a retry would take just as long.
          throw Object.assign(new Error(`AI answer exceeded ${opts.maxTokens ?? 1200} tokens`), { name: 'LengthError' });
        }
        return data.response;
      } catch (e: any) {
        clearTimeout(timeoutId);
        throw e;
      }
    };

    // First attempt
    let rawResponse = '';
    try {
      rawResponse = await callApi(prompt);
      return JSON.parse(rawResponse) as T;
    } catch (firstErr: any) {
      // A timeout means the model is too slow for this request; retrying would double the wait.
      if (firstErr?.name === 'AbortError') {
        throw new Error(`AI request timed out after ${Math.round(this.timeoutMs / 1000)}s using model "${model}".`);
      }
      if (firstErr?.name === 'LengthError') {
        throw firstErr;
      }

      // If Ollama is offline, bubble up descriptive error
      const health = await this.checkHealth();
      if (!health.online) {
        throw new Error('AI engine is currently offline. Please ensure Ollama is running.');
      }

      // Retry once with repair prompt
      try {
        const repairPrompt = `The previous response failed to parse as valid JSON.
Faulty Output:
${rawResponse.slice(0, 1000)}

Original Request:
${prompt}

Please output ONLY the valid JSON strictly matching the requested format. No markdown, no prose.`;
        const retryResponse = await callApi(repairPrompt);
        return JSON.parse(retryResponse) as T;
      } catch (retryErr: any) {
        throw new Error(`AI structured generation failed after retry: ${retryErr.message}`);
      }
    }
  }

  async chatStream(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const health = await this.checkHealth();
    if (!health.online) {
      throw new Error(`AI engine is currently offline. Start Ollama and make sure "${this.textModel}" is installed.`);
    }

    const payload = {
      model: this.textModel,
      messages,
      stream: true,
      keep_alive: this.keepAlive,
      options: {
        temperature: 0.7,
        num_ctx: this.numCtx,
        num_predict: 450 // a coaching reply of up to ~300 words
      }
    };

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama chat stream failed: HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    // Ollama streams newline-delimited JSON. A network chunk can end mid-line,
    // so keep the unfinished tail in a buffer until the rest arrives.
    const handleLine = (line: string) => {
      if (!line.trim()) return;
      let parsed: { message?: { content: string }; error?: string; done?: boolean };
      try {
        parsed = JSON.parse(line);
      } catch {
        return;
      }
      if (parsed.error) throw new Error(`Ollama error: ${parsed.error}`);
      if ((parsed as any).done) this.logTiming('chat', this.textModel, parsed);
      if (parsed.message?.content) {
        fullResponse += parsed.message.content;
        onChunk(parsed.message.content);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        handleLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
      }
    }
    buffer += decoder.decode();
    handleLine(buffer);

    return fullResponse;
  }
}

export const ollamaService = new OllamaService();
