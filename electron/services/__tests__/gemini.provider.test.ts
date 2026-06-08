import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '../gemini.provider';

// Create a mock inside the scope that we can import
const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      constructor(apiKey: string) {}
      getGenerativeModel() {
        return {
          generateContent: mockGenerateContent
        };
      }
    }
  };
});

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiProvider('fake-api-key');
  });

  describe('generateText', () => {
    it('should throw an error when the model fails to generate content', async () => {
      const testError = new Error('API Rate Limit Exceeded');
      mockGenerateContent.mockRejectedValueOnce(testError);

      await expect(provider.generateText('test prompt')).rejects.toThrow('API Rate Limit Exceeded');
    });

    it('should return text when content generation is successful', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Success text',
        },
      });

      const result = await provider.generateText('test prompt');
      expect(result).toBe('Success text');
    });
  });

  describe('testConnection', () => {
      it('should return false when connection fails', async () => {
        mockGenerateContent.mockRejectedValueOnce(new Error('Connection failed'));

        const result = await provider.testConnection();
        expect(result).toBe(false);
      });

      it('should return true when connection succeeds and returns OK', async () => {
        mockGenerateContent.mockResolvedValueOnce({
          response: {
            text: () => 'OK',
          },
        });

        const result = await provider.testConnection();
        expect(result).toBe(true);
      });
  });

});
