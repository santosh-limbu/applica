import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as aiService from '../services/ai.service';
import * as db from '../services/database.service';
import * as storage from '../services/storage.service';

vi.mock('../services/database.service');
vi.mock('../services/storage.service');

describe('AI Config Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getProviderConfig', () => {
    it('should return default ollama config when db settings are empty', () => {
      vi.mocked(db.getSetting).mockReturnValue(null);

      const config = aiService.getProviderConfig();

      expect(config).toEqual({
        provider: 'ollama',
        endpoint: undefined,
        model: undefined,
        apiKey: undefined,
      });
      expect(db.getSetting).toHaveBeenCalledWith('ai_provider');
    });

    it('should return gemini config and fetch apiKey from storage', () => {
      vi.mocked(db.getSetting).mockImplementation((key) => {
        if (key === 'ai_provider') return 'gemini';
        if (key === 'ai_model') return 'gemini-2.0-flash';
        return null;
      });
      vi.mocked(storage.getApiKey).mockReturnValue('test-gemini-key');

      const config = aiService.getProviderConfig();

      expect(config).toEqual({
        provider: 'gemini',
        endpoint: undefined,
        model: 'gemini-2.0-flash',
        apiKey: 'test-gemini-key',
      });
      expect(db.getSetting).toHaveBeenCalledWith('ai_provider');
      expect(storage.getApiKey).toHaveBeenCalled();
    });

    it('should return openai-compat config and fetch apiKey from db', () => {
      vi.mocked(db.getSetting).mockImplementation((key) => {
        if (key === 'ai_provider') return 'openai-compat';
        if (key === 'ai_endpoint') return 'http://localhost:1234';
        if (key === 'ai_api_key') return 'test-openai-key';
        return null;
      });

      const config = aiService.getProviderConfig();

      expect(config).toEqual({
        provider: 'openai-compat',
        endpoint: 'http://localhost:1234',
        model: undefined,
        apiKey: 'test-openai-key',
      });
      expect(db.getSetting).toHaveBeenCalledWith('ai_provider');
      expect(db.getSetting).toHaveBeenCalledWith('ai_api_key');
      expect(storage.getApiKey).not.toHaveBeenCalled();
    });
  });

  describe('saveProviderConfig', () => {
    it('should save basic provider config correctly', () => {
      aiService.saveProviderConfig({ provider: 'ollama' });

      expect(db.setSetting).toHaveBeenCalledWith('ai_provider', 'ollama');
      expect(db.setSetting).not.toHaveBeenCalledWith('ai_endpoint', expect.anything());
      expect(db.setSetting).not.toHaveBeenCalledWith('ai_model', expect.anything());
      expect(db.setSetting).not.toHaveBeenCalledWith('ai_api_key', expect.anything());
      expect(storage.saveApiKey).not.toHaveBeenCalled();
    });

    it('should save full provider config correctly', () => {
      aiService.saveProviderConfig({
        provider: 'openai-compat',
        endpoint: 'http://localhost:1234',
        model: 'llama3',
        apiKey: 'test-key',
      });

      expect(db.setSetting).toHaveBeenCalledWith('ai_provider', 'openai-compat');
      expect(db.setSetting).toHaveBeenCalledWith('ai_endpoint', 'http://localhost:1234');
      expect(db.setSetting).toHaveBeenCalledWith('ai_model', 'llama3');
      expect(db.setSetting).toHaveBeenCalledWith('ai_api_key', 'test-key');
      expect(storage.saveApiKey).not.toHaveBeenCalled();
    });

    it('should save gemini config and use storage for apiKey', () => {
      aiService.saveProviderConfig({
        provider: 'gemini',
        apiKey: 'gemini-secret',
      });

      expect(db.setSetting).toHaveBeenCalledWith('ai_provider', 'gemini');
      expect(db.setSetting).not.toHaveBeenCalledWith('ai_api_key', expect.anything());
      expect(storage.saveApiKey).toHaveBeenCalledWith('gemini-secret');
    });
  });

  describe('parseProfileFromText', () => {
    it('should call generateText and parse structured JSON response', async () => {
      const mockGenerateText = vi.fn().mockResolvedValue(
        JSON.stringify({
          profile: { full_name: 'John Doe' },
          experiences: [],
          education: [],
          skills: [],
          certifications: [],
        })
      );

      const mockProvider = {
        generateText: mockGenerateText,
        testConnection: vi.fn(),
        listModels: vi.fn(),
      } as any;

      const result = await aiService.parseProfileFromText('Mock LinkedIn Text', mockProvider);

      expect(result.profile.full_name).toBe('John Doe');
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.stringContaining('Mock LinkedIn Text'),
        expect.any(String),
        expect.any(Function)
      );
    });
  });
});

