import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as dbService from '../database.service';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => ':memory:'),
  },
}));

vi.mock('better-sqlite3', () => {
  class MockDatabase {
    private settings: Record<string, string> = {};

    pragma() {}
    exec() {}
    close() {}

    prepare(sql: string) {
      const isSelect = sql.toLowerCase().includes('select');
      const isInsert = sql.toLowerCase().includes('insert') || sql.toLowerCase().includes('replace');

      return {
        get: (key: string) => {
          if (isSelect) {
            const val = this.settings[key];
            return val !== undefined ? { value: val } : undefined;
          }
          return undefined;
        },
        run: (key: string, val: string) => {
          if (isInsert) {
            this.settings[key] = val;
          }
          return { changes: 1 };
        },
        all: () => []
      };
    }
  }

  return {
    default: MockDatabase
  };
});

describe('Database Service - Settings', () => {
  beforeEach(() => {
    dbService.initDatabase();
  });

  afterEach(() => {
    dbService.closeDatabase();
  });

  it('should return null for a non-existent setting key', () => {
    const value = dbService.getSetting('non_existent_key');
    expect(value).toBeNull();
  });

  it('should set and get a setting correctly', () => {
    dbService.setSetting('test_key', 'test_value');
    const value = dbService.getSetting('test_key');
    expect(value).toBe('test_value');
  });

  it('should overwrite an existing setting', () => {
    dbService.setSetting('test_key', 'initial_value');
    dbService.setSetting('test_key', 'new_value');
    const value = dbService.getSetting('test_key');
    expect(value).toBe('new_value');
  });
});
