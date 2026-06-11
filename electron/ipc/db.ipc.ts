// ============================================================
// Applica — Database CRUD IPC Handlers
// ============================================================

import { ipcMain } from 'electron';
import * as db from '../services/database.service';

/**
 * Helper to register standard IPC handlers that wrap a service function
 * in a try/catch block, with consistent error handling and defaults.
 */
function registerHandler(channel: string, dbFunction: (...args: any[]) => any, defaultReturnValue?: any) {
  ipcMain.handle(channel, (_event, ...args) => {
    try {
      return dbFunction(...args);
    } catch (err) {
      console.error(`[IPC:${channel}]`, err);

      const isReadOp = channel.startsWith('get');
      if (isReadOp) {
        return defaultReturnValue !== undefined ? defaultReturnValue : [];
      }

      let action = 'process';
      if (channel.startsWith('save')) action = 'save';
      else if (channel.startsWith('delete')) action = 'delete';
      else if (channel.startsWith('update')) action = 'update';

      // Extract entity name, e.g. "saveProfile" -> "profile"
      const entity = channel.replace(/^(save|delete|update|get)/, '').replace(/([A-Z])/g, ' $1').trim().toLowerCase();

      throw new Error(`Failed to ${action} ${entity}: ${(err as Error).message}`);
    }
  });
}

export function registerDbHandlers(): void {
  // ── Profile ──────────────────────────────────────────────────
  registerHandler('getProfile', db.getProfile, null);
  registerHandler('saveProfile', db.saveProfile);

  // ── Experiences ──────────────────────────────────────────────
  registerHandler('getExperiences', db.getExperiences, []);
  registerHandler('saveExperience', db.saveExperience);
  registerHandler('deleteExperience', db.deleteExperience);

  // ── Education ────────────────────────────────────────────────
  registerHandler('getEducation', db.getEducation, []);
  registerHandler('saveEducation', db.saveEducation);
  registerHandler('deleteEducation', db.deleteEducation);

  // ── Skills ───────────────────────────────────────────────────
  registerHandler('getSkills', db.getSkills, []);
  registerHandler('saveSkill', db.saveSkill);
  registerHandler('deleteSkill', db.deleteSkill);

  // ── Certifications ───────────────────────────────────────────
  registerHandler('getCertifications', db.getCertifications, []);
  registerHandler('saveCertification', db.saveCertification);
  registerHandler('deleteCertification', db.deleteCertification);

  // ── Applications ─────────────────────────────────────────────
  registerHandler('getApplications', db.getApplications, []);
  registerHandler('getApplication', db.getApplicationById, null);
  registerHandler('saveApplication', db.saveApplication);
  registerHandler('updateApplicationStatus', db.updateApplicationStatus);
  registerHandler('deleteApplication', db.deleteApplication);

  // ── CVs ──────────────────────────────────────────────────────
  registerHandler('saveCv', db.saveCv);
  registerHandler('getCvs', db.getCvs, []);

  // ── Cover Letters ────────────────────────────────────────────
  registerHandler('saveCoverLetter', db.saveCoverLetter);
  registerHandler('getCoverLetters', db.getCoverLetters, []);
}
