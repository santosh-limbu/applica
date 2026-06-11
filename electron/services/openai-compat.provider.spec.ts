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

    it('should send system prompt as a system role message if provided', async () => {
      // Arrange
      const mockContent = 'Test output response';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: mockContent,
              },
              finish_reason: 'stop',
            },
          ],
        }),
      });

      // Act
      const result = await provider.generateText('User prompt', 'System prompt instruction');

      // Assert
      expect(result).toBe(mockContent);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      const fetchCallArgs = (global.fetch as any).mock.calls[0];
      const fetchUrl = fetchCallArgs[0];
      const fetchInit = fetchCallArgs[1];
      const requestBody = JSON.parse(fetchInit.body);

      expect(fetchUrl).toBe('http://localhost:1234/v1/chat/completions');
      expect(requestBody.messages).toEqual([
        { role: 'system', content: 'System prompt instruction' },
        { role: 'user', content: 'User prompt' },
      ]);
    });

    it('should not send a system role message if system prompt is not provided', async () => {
      // Arrange
      const mockContent = 'Test output response';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: mockContent,
              },
              finish_reason: 'stop',
            },
          ],
        }),
      });

      // Act
      const result = await provider.generateText('User prompt');

      // Assert
      expect(result).toBe(mockContent);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      const fetchCallArgs = (global.fetch as any).mock.calls[0];
      const fetchInit = fetchCallArgs[1];
      const requestBody = JSON.parse(fetchInit.body);

      expect(requestBody.messages).toEqual([
        { role: 'user', content: 'User prompt' },
      ]);
    });
  });
});
