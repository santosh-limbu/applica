import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerAiHandlers } from '../ai.ipc';
import { ipcMain } from 'electron';
import * as ai from '../../services/ai.service';
import * as db from '../../services/database.service';
import * as storage from '../../services/storage.service';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('../../services/ai.service', () => ({
  generateCoverLetter: vi.fn(),
  analyzeJob: vi.fn(),
}));

vi.mock('../../services/database.service', () => ({
  getApplicationById: vi.fn(),
  getProfileById: vi.fn(),
  getExperiences: vi.fn(),
  getEducation: vi.fn(),
  getCertifications: vi.fn(),
  saveApplication: vi.fn(),
  saveCoverLetter: vi.fn(),
}));

vi.mock('../../services/storage.service', () => ({
  getApiKey: vi.fn(),
}));

describe('AI IPC Handlers - generateCoverLetter', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerAiHandlers();
  });

  it('should return error object when generateCoverLetter service throws', async () => {
    // 1. Find the registered handler for 'generateCoverLetter'
    const calls = (ipcMain.handle as any).mock.calls;
    const generateCoverLetterCall = calls.find((call: any[]) => call[0] === 'generateCoverLetter');
    expect(generateCoverLetterCall).toBeDefined();

    const handler = generateCoverLetterCall[1];

    // 2. Setup mocks to get past the initial checks
    const mockApplicationId = 1;
    (storage.getApiKey as any).mockReturnValue('fake-api-key');
    (db.getApplicationById as any).mockReturnValue({
      profile_id: 1,
      job_description: 'Software Engineer',
      ai_analysis: JSON.stringify({ skills: ['TS'] }),
    });
    (db.getProfileById as any).mockReturnValue({ id: 1, name: 'John Doe' });
    (db.getExperiences as any).mockReturnValue([]);
    (db.getEducation as any).mockReturnValue([]);
    (db.getCertifications as any).mockReturnValue([]);

    // 3. Mock ai.generateCoverLetter to throw an error
    const testError = new Error('AI Service Down');
    (ai.generateCoverLetter as any).mockRejectedValue(testError);

    // 4. Assert that calling the handler returns the expected error object
    const result = await handler(null, mockApplicationId);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[IPC:generateCoverLetter]', testError);
    expect(result).toEqual({ success: false, error: 'Cover letter generation failed: AI Service Down' });
  });
});
