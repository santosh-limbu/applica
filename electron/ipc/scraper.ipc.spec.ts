import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';
import { registerScraperHandlers } from './scraper.ipc';
import { scrapeJobUrl } from '../services/scraper.service';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('../services/scraper.service', () => ({
  scrapeJobUrl: vi.fn(),
}));

vi.mock('../services/ai.service', () => ({
  parseProfileFromText: vi.fn(),
  cleanJobDescription: vi.fn((desc) => Promise.resolve(desc)),
}));

describe('registerScraperHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should throw an error with the correct message when scrapeJobUrl fails', async () => {
    const testUrl = 'https://example.com/job';
    const mockErrorMsg = 'Network timeout';

    vi.mocked(scrapeJobUrl).mockRejectedValue(new Error(mockErrorMsg));

    registerScraperHandlers();

    const handleCalls = vi.mocked(ipcMain.handle).mock.calls;
    const scrapeJobUrlCall = handleCalls.find(call => call[0] === 'scrapeJobUrl');

    expect(scrapeJobUrlCall).toBeDefined();

    const handler = scrapeJobUrlCall![1];

    await expect(handler({} as any, testUrl)).rejects.toThrow(`Scraping failed: ${mockErrorMsg}`);
  });
});
