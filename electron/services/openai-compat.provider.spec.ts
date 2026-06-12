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

    it('should fall back to reasoning_content if content is empty or whitespace', async () => {
      // Arrange
      const mockReasoning = 'Reasoning output text';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: '   ',
                reasoning_content: mockReasoning,
              },
              finish_reason: 'stop',
            },
          ],
        }),
      });

      // Act
      const result = await provider.generateText('User prompt');

      // Assert
      expect(result).toBe(mockReasoning);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should request streaming and call onToken for each chunk', async () => {
      // Arrange
      const chunks = [
        'data: {"choices": [{"delta": {"content": "Hello"}}]}\n',
        'data: {"choices": [{"delta": {"content": " World"}}]}\n',
        'data: [DONE]\n'
      ];
      
      const readableStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of chunks) {
            yield new TextEncoder().encode(chunk);
          }
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        body: readableStream
      });

      const onToken = vi.fn();

      // Act
      const result = await provider.generateText('User prompt', undefined, onToken);

      // Assert
      expect(result).toBe('Hello World');
      expect(onToken).toHaveBeenCalledTimes(2);
      expect(onToken).toHaveBeenNthCalledWith(1, 'Hello');
      expect(onToken).toHaveBeenNthCalledWith(2, ' World');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const fetchCallArgs = (global.fetch as any).mock.calls[0];
      const fetchInit = fetchCallArgs[1];
      const requestBody = JSON.parse(fetchInit.body);
      expect(requestBody.stream).toBe(true);
    });
  });

  describe('listModels', () => {
    it('should fetch from /v1/models and return IDs for standard provider', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'model-a' },
            { id: 'model-b' }
          ]
        })
      });

      const result = await provider.listModels();
      expect(result).toEqual(['model-a', 'model-b']);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect((global.fetch as any).mock.calls[0][0]).toBe('http://localhost:1234/v1/models');
    });

    it('should not query /api/tags for standard provider if /v1/models fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.listModels();
      expect(result).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect((global.fetch as any).mock.calls[0][0]).toBe('http://localhost:1234/v1/models');
    });

    it('should query /api/tags for Ollama provider if /v1/models fails', async () => {
      const ollamaProvider = new OpenAICompatProvider('http://localhost:11434', 'llama3.2', undefined, 'Ollama');
      
      // /v1/models fails
      (global.fetch as any).mockRejectedValueOnce(new Error('No OpenAI compat endpoint'));
      // /api/tags succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          models: [
            { name: 'llama3:latest' }
          ]
        })
      });

      const result = await ollamaProvider.listModels();
      expect(result).toEqual(['llama3:latest']);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect((global.fetch as any).mock.calls[0][0]).toBe('http://localhost:11434/v1/models');
      expect((global.fetch as any).mock.calls[1][0]).toBe('http://localhost:11434/api/tags');
    });
  });

  describe('testConnection', () => {
    it('should return true if /v1/models returns 200', async () => {
      const defaultProvider = new OpenAICompatProvider(mockEndpoint, 'default', undefined);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true
      });

      const result = await defaultProvider.testConnection();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect((global.fetch as any).mock.calls[0][0]).toBe('http://localhost:1234/v1/models');
    });

    it('should not try /api/tags for standard provider if /v1/models fails', async () => {
      const defaultProvider = new OpenAICompatProvider(mockEndpoint, 'default', undefined);
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection failed'));

      const result = await defaultProvider.testConnection();
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect((global.fetch as any).mock.calls[0][0]).toBe('http://localhost:1234/v1/models');
    });

    it('should fall back to /api/tags for Ollama provider if /v1/models fails', async () => {
      const ollamaProvider = new OpenAICompatProvider('http://localhost:11434', 'default', undefined, 'Ollama');
      
      (global.fetch as any).mockRejectedValueOnce(new Error('No OpenAI endpoint'));
      (global.fetch as any).mockResolvedValueOnce({
        ok: true
      });

      const result = await ollamaProvider.testConnection();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect((global.fetch as any).mock.calls[0][0]).toBe('http://localhost:11434/v1/models');
      expect((global.fetch as any).mock.calls[1][0]).toBe('http://localhost:11434/api/tags');
    });
  });
});
