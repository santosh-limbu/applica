
// ============================================================
// Applica — Settings & Storage IPC Handlers
// ============================================================

import { ipcMain, app } from 'electron';
import * as db from '../services/database.service';
import * as storage from '../services/storage.service';
import {
  testConnection,
  testProviderConnection,
  listProviderModels,
  getProviderConfig,
  saveProviderConfig,
} from '../services/ai.service';
import { AVAILABLE_PROVIDERS, type ProviderConfig } from '../services/ai-provider.interface';

/**
 * Helper to register standard Settings/Storage IPC handlers that wrap a service function
 * in a try/catch block, with consistent error handling and defaults.
 */
function registerHandler(channel: string, serviceFunction: (...args: any[]) => any, defaultReturnValue?: any, isWrite = false) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return await serviceFunction(...args);
    } catch (err) {
      console.error(`[IPC:${channel}]`, err);
      if (isWrite) {
        // Extract what failed, e.g. "saveProviderConfig" -> "ProviderConfig"
        const entity = channel.replace(/^(save|set)/, '');
        throw new Error(`Failed to save ${entity.toLowerCase()}: ${(err as Error).message}`);
      }
      return defaultReturnValue !== undefined ? defaultReturnValue : null;
    }
  });
}

export function registerSettingsHandlers(): void {
  // ── App Settings (key-value store) ───────────────────────────
  registerHandler('getSettings', db.getSetting, null);

  // Custom for setSettings since its error message is slightly different
  ipcMain.handle('setSettings', (_event, key: string, value: string) => {
    try {
      db.setSetting(key, value);
    } catch (err) {
      console.error('[IPC:setSettings]', err);
      throw new Error(`Failed to save setting "${key}": ${(err as Error).message}`);
    }
  });

  // ── Secure API Key Storage ───────────────────────────────────
  registerHandler('saveApiKey', storage.saveApiKey, null, true);
  registerHandler('getApiKey', storage.getApiKey, null);
  registerHandler('testApiKey', testConnection, false);

  // ── AI Provider Management ───────────────────────────────────
  ipcMain.handle('getAvailableProviders', () => AVAILABLE_PROVIDERS);

  // Custom for getProviderConfig due to key masking
  ipcMain.handle('getProviderConfig', () => {
    try {
      const config = getProviderConfig();
      // Never leak API keys to the renderer — mask them
      return {
        ...config,
        apiKey: config.apiKey ? '••••••••' : undefined,
      };
    } catch (err) {
      console.error('[IPC:getProviderConfig]', err);
      return { provider: 'ollama', endpoint: 'http://localhost:11434' };
    }
  });

  registerHandler('saveProviderConfig', saveProviderConfig, null, true);
  registerHandler('testProviderConnection', testProviderConnection, false);
  registerHandler('listProviderModels', listProviderModels, []);

  // ── First Run Check ──────────────────────────────────────────
  registerHandler('isFirstRun', db.isFirstRun, true);

  // ── App Version (synchronous) ────────────────────────────────
  ipcMain.on('getAppVersion', (event) => {
    event.returnValue = app.getVersion();
  });
}
