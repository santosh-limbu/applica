import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getApiKey, saveApiKey, hasApiKey, deleteApiKey } from '../storage.service';

// vi.mock needs to be hoisted, so we can't use variables defined outside of it easily in Vitest unless we use vi.hoisted or define them inside.
// A simpler way is to mock it fully inside the factory, or just use the module normally and mock its methods if it's imported.
vi.mock('electron', () => {
  return {
    app: {
      getPath: vi.fn(() => '/mock/user/data/path'),
    },
    safeStorage: {
      isEncryptionAvailable: vi.fn(() => true),
      encryptString: vi.fn((str) => `encrypted_${str}`),
      decryptString: vi.fn((str) => str.toString().replace('encrypted_', '')),
    },
  };
});

vi.mock('fs');

describe('Storage Service', () => {
  const mockPath = path.join('/mock/user/data/path', 'api-key.enc');

  let electronMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    electronMock = await import('electron');
  });

  describe('getApiKey', () => {
    it('returns null if the file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = getApiKey();

      expect(fs.existsSync).toHaveBeenCalledWith(mockPath);
      expect(result).toBeNull();
    });

    it('decrypts and returns the key if encryption is available', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('encrypted_my-secret-key'));
      vi.mocked(electronMock.safeStorage.isEncryptionAvailable).mockReturnValue(true);

      const result = getApiKey();

      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath);
      expect(electronMock.safeStorage.decryptString).toHaveBeenCalledWith(Buffer.from('encrypted_my-secret-key'));
      expect(result).toBe('my-secret-key');
    });

    it('returns plaintext key if encryption is not available', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('my-plaintext-key'));
      vi.mocked(electronMock.safeStorage.isEncryptionAvailable).mockReturnValue(false);

      const result = getApiKey();

      expect(result).toBe('my-plaintext-key');
      expect(electronMock.safeStorage.decryptString).not.toHaveBeenCalled();
    });

    it('returns null on decryption error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('invalid-data'));
      vi.mocked(electronMock.safeStorage.isEncryptionAvailable).mockReturnValue(true);
      vi.mocked(electronMock.safeStorage.decryptString).mockImplementation(() => {
        throw new Error('Decryption failed');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = getApiKey();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('saveApiKey', () => {
    it('encrypts and saves the key if encryption is available', () => {
      vi.mocked(electronMock.safeStorage.isEncryptionAvailable).mockReturnValue(true);

      saveApiKey('new-key');

      expect(electronMock.safeStorage.encryptString).toHaveBeenCalledWith('new-key');
      expect(fs.writeFileSync).toHaveBeenCalledWith(mockPath, 'encrypted_new-key');
    });

    it('saves plaintext key if encryption is not available', () => {
      vi.mocked(electronMock.safeStorage.isEncryptionAvailable).mockReturnValue(false);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      saveApiKey('new-key');

      expect(fs.writeFileSync).toHaveBeenCalledWith(mockPath, 'new-key', 'utf-8');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('hasApiKey', () => {
    it('returns true if file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      expect(hasApiKey()).toBe(true);
    });

    it('returns false if file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(hasApiKey()).toBe(false);
    });
  });

  describe('deleteApiKey', () => {
    it('deletes the file if it exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      deleteApiKey();

      expect(fs.unlinkSync).toHaveBeenCalledWith(mockPath);
    });

    it('does nothing if the file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      deleteApiKey();

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
