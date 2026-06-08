import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAICompatProvider } from './openai-compat.provider';

describe('OpenAICompatProvider', () => {
  const mockEndpoint = 'http://localhost:1234/v1';
  const mockModel = 'test-model';
  let provider: OpenAICompatProvider;

  beforeEach(() => {
    provider = new OpenAICompatProvider(mockEndpoint, mockModel, undefined);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('generateText', () => {
    it('should throw an error when fetch returns a non-200 status', async () => {
      // Arrange
      const mockErrorText = 'Internal Server Error';
      const mockStatus = 500;

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: mockStatus,
        text: () => Promise.resolve(mockErrorText),
      });

      // Act & Assert
      await expect(provider.generateText('Test prompt')).rejects.toThrow(
        `AI request failed (${mockStatus}): ${mockErrorText}`
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when fetch throws an exception', async () => {
      // Arrange
      const mockNetworkError = new Error('Network timeout');

      (global.fetch as any).mockRejectedValueOnce(mockNetworkError);

      // Act & Assert
      await expect(provider.generateText('Test prompt')).rejects.toThrow(mockNetworkError);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
