// ============================================================
// Applica — Scraper IPC Handlers
// ============================================================

import { ipcMain } from 'electron';
import { scrapeJobUrl } from '../services/scraper.service';

export function registerScraperHandlers(): void {
  ipcMain.handle('scrapeJobUrl', async (_event, url: string) => {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('A valid URL is required.');
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new Error(`Invalid URL format: ${url}`);
      }

      return await scrapeJobUrl(url);
    } catch (err) {
      console.error('[IPC:scrapeJobUrl]', err);
      throw new Error(`Scraping failed: ${(err as Error).message}`);
    }
  });
}
