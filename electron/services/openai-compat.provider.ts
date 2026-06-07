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
    this.baseUrl = endpoint.replace(/\/+$/, '');
    this.model = model;
    this.apiKey = apiKey;
    this.name = name;
  }

  async testConnection(): Promise<boolean> {
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
        signal: AbortSignal.timeout(15000), // 15s timeout for local models
      });

      if (!response.ok) return false;

      const data = (await response.json()) as ChatCompletionResponse;
      const text = data.choices?.[0]?.message?.content ?? '';
      return text.toLowerCase().includes('ok');
    } catch {
      return false;
    }
  }

  async generateText(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(120000), // 2min timeout — local models can be slow
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`AI request failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('AI returned an empty response.');
    }

    return content;
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
