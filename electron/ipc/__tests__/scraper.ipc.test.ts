import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';
import { registerScraperHandlers } from '../scraper.ipc';
import { scrapeJobUrl } from '../../services/scraper.service';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('../../services/scraper.service', () => ({
  scrapeJobUrl: vi.fn(),
}));

describe('Scraper IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register scrapeJobUrl handler', () => {
    registerScraperHandlers();
    expect(ipcMain.handle).toHaveBeenCalledWith('scrapeJobUrl', expect.any(Function));
  });

  describe('scrapeJobUrl handler', () => {
    let handler: (event: any, url: string) => Promise<any>;

    beforeEach(() => {
      registerScraperHandlers();
      handler = (ipcMain.handle as any).mock.calls.find((call: any) => call[0] === 'scrapeJobUrl')[1];
    });

    it('should throw if url is not provided', async () => {
      await expect(handler({}, undefined as any)).rejects.toThrow('Scraping failed: A valid URL is required.');
    });

    it('should throw if url is not a string', async () => {
      await expect(handler({}, 123 as any)).rejects.toThrow('Scraping failed: A valid URL is required.');
    });

    it('should throw if url is invalid format', async () => {
      await expect(handler({}, 'invalid-url')).rejects.toThrow('Scraping failed: Invalid URL format: invalid-url');
    });

    it('should call scrapeJobUrl service and return result', async () => {
      const mockResult = { title: 'Test Job', company: 'Test Company' };
      vi.mocked(scrapeJobUrl).mockResolvedValue(mockResult as any);

      const result = await handler({}, 'https://example.com/job');

      expect(scrapeJobUrl).toHaveBeenCalledWith('https://example.com/job');
      expect(result).toEqual(mockResult);
    });

    it('should catch error from scrapeJobUrl service and throw new Error', async () => {
      vi.mocked(scrapeJobUrl).mockRejectedValue(new Error('Service failed'));

      await expect(handler({}, 'https://example.com/job')).rejects.toThrow('Scraping failed: Service failed');
    });
  });
});
