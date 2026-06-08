import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registerDbHandlers } from '../db.ipc';
import * as db from '../../services/database.service';
import { ipcMain } from 'electron';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('../../services/database.service', () => ({
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
  getExperiences: vi.fn(),
  saveExperience: vi.fn(),
  deleteExperience: vi.fn(),
  getEducation: vi.fn(),
  saveEducation: vi.fn(),
  deleteEducation: vi.fn(),
  getSkills: vi.fn(),
  saveSkill: vi.fn(),
  deleteSkill: vi.fn(),
  getCertifications: vi.fn(),
  saveCertification: vi.fn(),
  deleteCertification: vi.fn(),
  getApplications: vi.fn(),
  getApplicationById: vi.fn(),
  saveApplication: vi.fn(),
  updateApplicationStatus: vi.fn(),
  deleteApplication: vi.fn(),
  saveCv: vi.fn(),
  getCvs: vi.fn(),
}));

describe('db.ipc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProfile handles errors correctly and returns null', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Register the handlers
    registerDbHandlers();

    // Get the handler for 'getProfile'
    const getProfileCall = vi.mocked(ipcMain.handle).mock.calls.find(c => c[0] === 'getProfile');
    expect(getProfileCall).toBeDefined();

    const handler = getProfileCall![1];

    // Mock db.getProfile to throw
    const error = new Error('Database connection failed');
    vi.mocked(db.getProfile).mockImplementation(() => {
      throw error;
    });

    // Call the handler
    const result = handler({} as any);

    // Verify it returns null
    expect(result).toBeNull();

    // Verify console.error was called
    expect(consoleErrorSpy).toHaveBeenCalledWith('[IPC:getProfile]', error);

    consoleErrorSpy.mockRestore();
  });
});
