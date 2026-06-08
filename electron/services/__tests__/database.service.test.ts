import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as dbService from '../database.service';
import Database from 'better-sqlite3';
import path from 'path';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => ':memory:'),
  },
}));

vi.mock('better-sqlite3', () => {
  return {
    default: class MockDatabase {
      constructor() {
        return new (require('better-sqlite3'))(':memory:');
      }
    }
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
