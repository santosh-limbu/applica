// ============================================================
// Applica — Settings & Storage IPC Handlers
// ============================================================

import { ipcMain, app } from 'electron';
import * as db from '../services/database.service';
import * as storage from '../services/storage.service';
import { testConnection } from '../services/ai.service';

export function registerSettingsHandlers(): void {
  // ── App Settings (key-value store) ───────────────────────────

  ipcMain.handle('getSettings', (_event, key: string) => {
    try {
      return db.getSetting(key);
    } catch (err) {
      console.error('[IPC:getSettings]', err);
      return null;
    }
  });

  ipcMain.handle('setSettings', (_event, key: string, value: string) => {
    try {
      db.setSetting(key, value);
    } catch (err) {
      console.error('[IPC:setSettings]', err);
      throw new Error(`Failed to save setting "${key}": ${(err as Error).message}`);
    }
  });

  // ── Secure API Key Storage ───────────────────────────────────

  ipcMain.handle('saveApiKey', (_event, key: string) => {
    try {
      storage.saveApiKey(key);
    } catch (err) {
      console.error('[IPC:saveApiKey]', err);
      throw new Error(`Failed to save API key: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('getApiKey', () => {
    try {
      return storage.getApiKey();
    } catch (err) {
      console.error('[IPC:getApiKey]', err);
      return null;
    }
  });

  ipcMain.handle('testApiKey', async (_event, key: string) => {
    try {
      return await testConnection(key);
    } catch (err) {
      console.error('[IPC:testApiKey]', err);
      return false;
    }
  });

  // ── First Run Check ──────────────────────────────────────────

  ipcMain.handle('isFirstRun', () => {
    try {
      return db.isFirstRun();
    } catch (err) {
      console.error('[IPC:isFirstRun]', err);
      return true;
    }
  });

  // ── App Version (synchronous) ────────────────────────────────

  ipcMain.on('getAppVersion', (event) => {
    event.returnValue = app.getVersion();
  });
}
