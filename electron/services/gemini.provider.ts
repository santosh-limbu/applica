// ============================================================
// Applica — Gemini AI Provider
// ============================================================

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { AIProvider } from './ai-provider.interface';

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
];

export class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini';
  private model: GenerativeModel;
  private modelName: string;

  constructor(
    private apiKey: string,
    modelName: string = 'gemini-2.0-flash'
  ) {
    this.modelName = modelName;
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: modelName });
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Respond with the single word: OK');
      const text = result.response.text();
      return text.toLowerCase().includes('ok');
    } catch {
      return false;
    }
  }

  async generateText(
    prompt: string,
    systemPrompt?: string,
    onToken?: (token: string) => void
  ): Promise<string> {
    const useStreaming = typeof onToken === 'function';

    if (systemPrompt) {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const modelWithSystem = genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemPrompt,
      });

      if (useStreaming) {
        const resultStream = await modelWithSystem.generateContentStream(prompt);
        let text = '';
        for await (const chunk of resultStream.stream) {
          const chunkText = chunk.text();
          text += chunkText;
          onToken!(chunkText);
        }
        return text;
      }

      const result = await modelWithSystem.generateContent(prompt);
      return result.response.text();
    }

    if (useStreaming) {
      const resultStream = await this.model.generateContentStream(prompt);
      let text = '';
      for await (const chunk of resultStream.stream) {
        const chunkText = chunk.text();
        text += chunkText;
        onToken!(chunkText);
      }
      return text;
    }

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  async listModels(): Promise<string[]> {
    // The Gemini SDK doesn't have a model listing endpoint easily accessible,
    // so we return a curated list of known models.
    return GEMINI_MODELS;
  }
}
