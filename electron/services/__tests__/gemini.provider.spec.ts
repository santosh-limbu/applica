import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '../gemini.provider';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Create mock functions outside to be accessible
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn().mockReturnValue({
  generateContent: mockGenerateContent
});

// Mock the GoogleGenerativeAI module
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      constructor() {}
      getGenerativeModel = mockGetGenerativeModel;
    }
  };
});

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiProvider('fake-api-key');
  });

  describe('testConnection', () => {
    it('should return false when generateContent throws an error', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API Error'));

      const result = await provider.testConnection();

      expect(result).toBe(false);
      expect(mockGenerateContent).toHaveBeenCalledWith('Respond with the single word: OK');
    });

    it('should return true when API responds with OK', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'ok'
        }
      });

      const result = await provider.testConnection();

      expect(result).toBe(true);
    });
  });

  describe('generateText', () => {
    it('should propagate errors from the API', async () => {
      const error = new Error('API Error');
      mockGenerateContent.mockRejectedValueOnce(error);

      await expect(provider.generateText('Test prompt')).rejects.toThrow('API Error');
    });

    it('should return the text response from the API', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Test response'
        }
      });

      const result = await provider.generateText('Test prompt');

      expect(result).toBe('Test response');
    });
  });

  describe('listModels', () => {
    it('should return the curated list of models', async () => {
      const result = await provider.listModels();

      expect(result).toEqual([
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
      ]);
    });
  });
});
