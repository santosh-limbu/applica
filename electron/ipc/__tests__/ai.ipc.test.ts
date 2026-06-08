import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ipcMain } from 'electron';
import { registerAiHandlers } from '../ai.ipc';
import * as ai from '../../services/ai.service';
import * as db from '../../services/database.service';
import * as storage from '../../services/storage.service';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('../../services/ai.service');
vi.mock('../../services/database.service');
vi.mock('../../services/storage.service');

describe('AI IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCoverLetter', () => {
    it('should return error object when ai service throws an error', async () => {
      registerAiHandlers();

      const handleCalls = vi.mocked(ipcMain.handle).mock.calls;
      const generateCoverLetterHandler = handleCalls.find((call: any) => call[0] === 'generateCoverLetter')![1];

      vi.mocked(storage.getApiKey).mockReturnValue('test-api-key');
      vi.mocked(db.getApplicationById).mockReturnValue({
        id: 1,
        profile_id: 1,
        job_description: 'Software Engineer',
      } as any);
      vi.mocked(db.getProfileById).mockReturnValue({ id: 1 } as any);
      vi.mocked(db.getExperiences).mockReturnValue([] as any);

      vi.mocked(ai.analyzeJob).mockResolvedValue({} as any);
      vi.mocked(ai.generateCoverLetter).mockRejectedValue(new Error('AI error'));

      const result = await generateCoverLetterHandler({} as any, 1);

      expect(result).toEqual({
        success: false,
        error: 'Cover letter generation failed: AI error'
      });
    });
  });
});
