// ============================================================
// Applica — Scraper IPC Handlers
// ============================================================

import { ipcMain } from 'electron';
import { scrapeJobUrl } from '../services/scraper.service';
import { openLinkedInScraper, completeLinkedInScrape } from '../services/profile-scraper.service';
import { parseProfileFromText, cleanJobDescription } from '../services/ai.service';

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

      const scraped = await scrapeJobUrl(url);
      if (scraped.description) {
        scraped.description = await cleanJobDescription(scraped.description);
      }
      return scraped;
    } catch (err) {
      console.error('[IPC:scrapeJobUrl]', err);
      throw new Error(`Scraping failed: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('openLinkedInScraper', async (_event, url: string) => {
    try {
      return await openLinkedInScraper(url);
    } catch (err) {
      console.error('[IPC:openLinkedInScraper]', err);
      throw new Error(`Failed to open LinkedIn browser: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('completeLinkedInScrape', async () => {
    try {
      return await completeLinkedInScrape();
    } catch (err) {
      console.error('[IPC:completeLinkedInScrape]', err);
      throw new Error(`Failed to complete scraping: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('parseProfileText', async (event, text: string) => {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Valid text content is required.');
      }
      return await parseProfileFromText(text, undefined, (progress) => {
        event.sender.send('parse-profile-progress', progress);
      });
    } catch (err) {
      console.error('[IPC:parseProfileText]', err);
      throw new Error(`Failed to parse profile: ${(err as Error).message}`);
    }
  });
}

