// ============================================================
// Applica — Database CRUD IPC Handlers
// ============================================================

import { ipcMain } from 'electron';
import * as db from '../services/database.service';
import type {
  Profile,
  Experience,
  Education,
  Skill,
  Certification,
  Application,
  CV
} from '../types';

export function registerDbHandlers(): void {
  // ── Profile ──────────────────────────────────────────────────

  ipcMain.handle('getProfile', () => {
    try {
      return db.getProfile();
    } catch (err) {
      console.error('[IPC:getProfile]', err);
      return null;
    }
  });

  ipcMain.handle('saveProfile', (_event, profile: Profile) => {
    try {
      return db.saveProfile(profile);
    } catch (err) {
      console.error('[IPC:saveProfile]', err);
      throw new Error(`Failed to save profile: ${(err as Error).message}`);
    }
  });

  // ── Experiences ──────────────────────────────────────────────

  ipcMain.handle('getExperiences', (_event, profileId: number) => {
    try {
      return db.getExperiences(profileId);
    } catch (err) {
      console.error('[IPC:getExperiences]', err);
      return [];
    }
  });

  ipcMain.handle('saveExperience', (_event, exp: Experience) => {
    try {
      return db.saveExperience(exp);
    } catch (err) {
      console.error('[IPC:saveExperience]', err);
      throw new Error(`Failed to save experience: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('deleteExperience', (_event, id: number) => {
    try {
      db.deleteExperience(id);
    } catch (err) {
      console.error('[IPC:deleteExperience]', err);
      throw new Error(`Failed to delete experience: ${(err as Error).message}`);
    }
  });

  // ── Education ────────────────────────────────────────────────

  ipcMain.handle('getEducation', (_event, profileId: number) => {
    try {
      return db.getEducation(profileId);
    } catch (err) {
      console.error('[IPC:getEducation]', err);
      return [];
    }
  });

  ipcMain.handle('saveEducation', (_event, edu: Education) => {
    try {
      return db.saveEducation(edu);
    } catch (err) {
      console.error('[IPC:saveEducation]', err);
      throw new Error(`Failed to save education: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('deleteEducation', (_event, id: number) => {
    try {
      db.deleteEducation(id);
    } catch (err) {
      console.error('[IPC:deleteEducation]', err);
      throw new Error(`Failed to delete education: ${(err as Error).message}`);
    }
  });

  // ── Skills ───────────────────────────────────────────────────

  ipcMain.handle('getSkills', (_event, profileId: number) => {
    try {
      return db.getSkills(profileId);
    } catch (err) {
      console.error('[IPC:getSkills]', err);
      return [];
    }
  });

  ipcMain.handle('saveSkill', (_event, skill: Skill) => {
    try {
      return db.saveSkill(skill);
    } catch (err) {
      console.error('[IPC:saveSkill]', err);
      throw new Error(`Failed to save skill: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('deleteSkill', (_event, id: number) => {
    try {
      db.deleteSkill(id);
    } catch (err) {
      console.error('[IPC:deleteSkill]', err);
      throw new Error(`Failed to delete skill: ${(err as Error).message}`);
    }
  });

  // ── Certifications ───────────────────────────────────────────

  ipcMain.handle('getCertifications', (_event, profileId: number) => {
    try {
      return db.getCertifications(profileId);
    } catch (err) {
      console.error('[IPC:getCertifications]', err);
      return [];
    }
  });

  ipcMain.handle('saveCertification', (_event, cert: Certification) => {
    try {
      return db.saveCertification(cert);
    } catch (err) {
      console.error('[IPC:saveCertification]', err);
      throw new Error(`Failed to save certification: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('deleteCertification', (_event, id: number) => {
    try {
      db.deleteCertification(id);
    } catch (err) {
      console.error('[IPC:deleteCertification]', err);
      throw new Error(`Failed to delete certification: ${(err as Error).message}`);
    }
  });

  // ── Applications ─────────────────────────────────────────────

  ipcMain.handle('getApplications', () => {
    try {
      return db.getApplications();
    } catch (err) {
      console.error('[IPC:getApplications]', err);
      return [];
    }
  });

  ipcMain.handle('getApplication', (_event, id: number) => {
    try {
      return db.getApplicationById(id);
    } catch (err) {
      console.error('[IPC:getApplication]', err);
      return null;
    }
  });

  ipcMain.handle('saveApplication', (_event, application: Application) => {
    try {
      return db.saveApplication(application);
    } catch (err) {
      console.error('[IPC:saveApplication]', err);
      throw new Error(`Failed to save application: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('updateApplicationStatus', (_event, id: number, status: string) => {
    try {
      db.updateApplicationStatus(id, status);
    } catch (err) {
      console.error('[IPC:updateApplicationStatus]', err);
      throw new Error(`Failed to update application status: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('deleteApplication', (_event, id: number) => {
    try {
      db.deleteApplication(id);
    } catch (err) {
      console.error('[IPC:deleteApplication]', err);
      throw new Error(`Failed to delete application: ${(err as Error).message}`);
    }
  });

  // ── CVs ──────────────────────────────────────────────────────

  ipcMain.handle('saveCv', (_event, cv: CV) => {
    try {
      return db.saveCv(cv);
    } catch (err) {
      console.error('[IPC:saveCv]', err);
      throw new Error(`Failed to save CV: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('getCvs', (_event, applicationId: number) => {
    try {
      return db.getCvs(applicationId);
    } catch (err) {
      console.error('[IPC:getCvs]', err);
      return [];
    }
  });
}
