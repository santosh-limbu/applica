// ============================================================
// Applica — IPC Handler Registry
// ============================================================

import { registerSettingsHandlers } from './settings.ipc';
import { registerDbHandlers } from './db.ipc';
import { registerAiHandlers } from './ai.ipc';
import { registerExportHandlers } from './export.ipc';
import { registerScraperHandlers } from './scraper.ipc';

/**
 * Register all IPC handlers for the main process.
 * Call this once during app initialization (before the window is created).
 */
export function registerAllHandlers(): void {
  registerSettingsHandlers();
  registerDbHandlers();
  registerAiHandlers();
  registerExportHandlers();
  registerScraperHandlers();
}
