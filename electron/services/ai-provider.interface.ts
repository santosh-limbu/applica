// ============================================================
// Applica — AI Provider Interface
// ============================================================
// All AI providers (Gemini, Ollama, OpenAI-compatible) implement
// this interface. The AI service uses it to remain provider-agnostic.

export interface AIProvider {
  /** Human-readable provider name */
  readonly name: string;

  /**
   * Test whether the provider is reachable and the config is valid.
   */
  testConnection(): Promise<boolean>;

  /**
   * Send a prompt and receive a text response.
   * This is the single method all AI features route through.
   */
  generateText(prompt: string): Promise<string>;

  /**
   * List available models from the provider.
   * Returns an array of model identifier strings.
   */
  listModels(): Promise<string[]>;
}

/** Serialisable configuration stored in the settings DB */
export interface ProviderConfig {
  provider: 'gemini' | 'ollama' | 'openai-compat';
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

/** Metadata returned to the UI for provider selection cards */
export interface ProviderInfo {
  id: 'gemini' | 'ollama' | 'openai-compat';
  name: string;
  description: string;
  defaultEndpoint?: string;
  requiresApiKey: boolean;
  icon: string; // lucide icon name
}

export const AVAILABLE_PROVIDERS: ProviderInfo[] = [
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run open-source models locally. Free, private, no internet required.',
    defaultEndpoint: 'http://localhost:11434',
    requiresApiKey: false,
    icon: 'Monitor',
  },
  {
    id: 'openai-compat',
    name: 'OpenAI Compatible',
    description: 'LM Studio, LocalAI, vLLM, or any OpenAI-compatible endpoint.',
    defaultEndpoint: 'http://localhost:1234',
    requiresApiKey: false,
    icon: 'Plug',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Cloud-based AI by Google. Requires a free API key.',
    requiresApiKey: true,
    icon: 'Sparkles',
  },
];
