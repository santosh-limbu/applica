// ============================================================
// Applica — OpenAI-Compatible AI Provider
// ============================================================
// Supports Ollama, LM Studio, LocalAI, vLLM, text-generation-webui,
// and any other server that exposes /v1/chat/completions.
// Uses Node's built-in fetch() — no extra dependencies.

import type { AIProvider } from './ai-provider.interface';

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      reasoning_content?: string;
    };
    finish_reason: string;
  }>;
}

interface ModelsResponse {
  data?: Array<{ id: string }>;
  models?: Array<{ name: string; model: string }>;  // Ollama /api/tags format
}

export class OpenAICompatProvider implements AIProvider {
  readonly name: string;
  private baseUrl: string;
  private model: string;
  private apiKey?: string;

  constructor(
    endpoint: string,
    model: string,
    apiKey?: string,
    name: string = 'OpenAI Compatible'
  ) {
    // Normalise: strip trailing slash
    let base = endpoint.replace(/\/+$/, '');
    
    // If the endpoint already ends with /v1, strip it so we can append /v1/chat/completions cleanly
    if (base.endsWith('/v1')) {
      base = base.substring(0, base.length - 3);
    }
    
    this.baseUrl = base;
    this.model = model;
    this.apiKey = apiKey;
    this.name = name;
  }

  async testConnection(): Promise<boolean> {
    let serverAlive = false;

    // 1. Try a cheap GET request to /v1/models to see if the server is reachable and active
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: this._headers(),
        signal: AbortSignal.timeout(5000), // 5s timeout for server ping
      });
      if (response.ok) {
        serverAlive = true;
      }
    } catch {
      // Fall through
    }

    // Try Ollama specific /api/tags if the standard models list failed
    if (this.name === 'Ollama' && !serverAlive) {
      try {
        const response = await fetch(`${this.baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          serverAlive = true;
        }
      } catch {
        // Fall through
      }
    }

    // If the server is not alive at all, fail immediately
    if (!serverAlive) {
      return false;
    }

    // If the server is alive and we don't have a model selected yet, count this as a successful server check
    if (!this.model || this.model === 'default' || this.model === '') {
      return true;
    }

    // 2. If a model is specified, try running a quick chat completions check
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Respond with the single word: OK' }],
          max_tokens: 10,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (response.ok) {
        const data = (await response.json()) as ChatCompletionResponse;
        const text = data.choices?.[0]?.message?.content ?? '';
        if (text.toLowerCase().includes('ok')) {
          return true;
        }
      }
    } catch {
      // If completions fail (e.g. GPU/CPU lag, timeout, slow loading),
      // fallback to the server status since the endpoint is responding to /models
    }

    return serverAlive;
  }

  async generateText(
    prompt: string,
    systemPrompt?: string,
    onToken?: (token: string) => void
  ): Promise<string> {
    const messages: Array<{ role: string; content: string }> = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
      : [{ role: 'user', content: prompt }];

    const useStreaming = typeof onToken === 'function';

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.4,
        max_tokens: 4096, // Ensure local reasoning models have enough tokens to finish thinking
        stream: useStreaming,
      }),
      signal: AbortSignal.timeout(120000), // 2min timeout — local models can be slow
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`AI request failed (${response.status}): ${errorText}`);
    }

    if (useStreaming) {
      if (!response.body) {
        throw new Error('Response body is empty.');
      }

      const decoder = new TextDecoder();
      let content = '';
      let reasoningContent = '';
      let buffer = '';

      for await (const chunk of response.body as any) {
        const chunkText = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        buffer += chunkText;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let streamEnded = false;
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === 'data: [DONE]') {
            streamEnded = true;
            break;
          }
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content || '';
              const rDelta = parsed.choices?.[0]?.delta?.reasoning_content || '';

              if (delta) {
                content += delta;
                onToken!(delta);
              }
              if (rDelta) {
                reasoningContent += rDelta;
                onToken!(rDelta); // also stream reasoning tokens so the user sees progress!
              }
            } catch (e) {
              // Ignore incomplete JSON chunks
            }
          }
        }
        if (streamEnded) {
          break;
        }
      }

      // Fallback: If content is empty or only whitespace, and reasoningContent is present,
      // use reasoningContent. This prevents failures with local reasoning models (e.g. DeepSeek-R1-distill).
      if ((!content || !content.trim()) && reasoningContent && reasoningContent.trim()) {
        content = reasoningContent;
      }

      if (!content) {
        throw new Error('AI returned an empty response.');
      }

      return content;
    } else {
      const data = (await response.json()) as ChatCompletionResponse;
      let content = data.choices?.[0]?.message?.content;
      const reasoningContent = data.choices?.[0]?.message?.reasoning_content;

      // Fallback: If content is empty or only whitespace, and reasoning_content is present,
      // use reasoning_content. This prevents failures with local reasoning models (e.g. DeepSeek-R1-distill).
      if ((!content || !content.trim()) && reasoningContent && reasoningContent.trim()) {
        content = reasoningContent;
      }

      if (!content) {
        throw new Error('AI returned an empty response.');
      }

      return content;
    }
  }

  async listModels(): Promise<string[]> {
    const models: string[] = [];

    // Try OpenAI-compatible /v1/models first
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: this._headers(),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = (await response.json()) as ModelsResponse;
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((m) => m.id);
        }
      }
    } catch {
      // Fall through to Ollama-specific endpoint
    }

    // Try Ollama /api/tags
    if (this.name === 'Ollama') {
      try {
        const response = await fetch(`${this.baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = (await response.json()) as ModelsResponse;
          if (data.models && Array.isArray(data.models)) {
            return data.models.map((m) => m.name || m.model);
          }
        }
      } catch {
        // No models found
      }
    }

    return models;
  }

  private _headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }
}
