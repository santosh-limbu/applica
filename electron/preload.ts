// ============================================================
// Applica — Preload Script (Context Bridge)
// ============================================================
import type { Education } from "../src/types/ipc.types";

import { contextBridge, ipcRenderer } from 'electron';
import type { Application, Experience } from './types';

// ── Exposed API ──────────────────────────────────────────────
// Every method maps 1:1 to an ipcMain.handle() registered in electron/ipc/.
// The renderer can call these via window.api.<method>().

contextBridge.exposeInMainWorld('api', {
  // ── Settings ─────────────────────────────────────────────────
  getSettings: (key: string) => ipcRenderer.invoke('getSettings', key),
  setSettings: (key: string, value: string) => ipcRenderer.invoke('setSettings', key, value),

  // ── API Key (Secure) ────────────────────────────────────────
  saveApiKey: (key: string) => ipcRenderer.invoke('saveApiKey', key),
  getApiKey: () => ipcRenderer.invoke('getApiKey'),
  testApiKey: (key: string) => ipcRenderer.invoke('testApiKey', key),

  // ── AI Provider Management ──────────────────────────────────
  getAvailableProviders: () => ipcRenderer.invoke('getAvailableProviders'),
  getProviderConfig: () => ipcRenderer.invoke('getProviderConfig'),
  saveProviderConfig: (config: any) => ipcRenderer.invoke('saveProviderConfig', config),
  testProviderConnection: (config: any) => ipcRenderer.invoke('testProviderConnection', config),
  listProviderModels: (config: any) => ipcRenderer.invoke('listProviderModels', config),

  // ── Profile ──────────────────────────────────────────────────
  getProfile: () => ipcRenderer.invoke('getProfile'),
  saveProfile: (profile: any) => ipcRenderer.invoke('saveProfile', profile),

  // ── Experience ───────────────────────────────────────────────
  getExperiences: (profileId: number) => ipcRenderer.invoke('getExperiences', profileId),
  saveExperience: (exp: Experience) => ipcRenderer.invoke('saveExperience', exp),
  deleteExperience: (id: number) => ipcRenderer.invoke('deleteExperience', id),

  // ── Education ────────────────────────────────────────────────
  getEducation: (profileId: number) => ipcRenderer.invoke('getEducation', profileId),
  saveEducation: (edu: Education) => ipcRenderer.invoke('saveEducation', edu),
  deleteEducation: (id: number) => ipcRenderer.invoke('deleteEducation', id),

  // ── Skills ───────────────────────────────────────────────────
  getSkills: (profileId: number) => ipcRenderer.invoke('getSkills', profileId),
  saveSkill: (skill: any) => ipcRenderer.invoke('saveSkill', skill),
  deleteSkill: (id: number) => ipcRenderer.invoke('deleteSkill', id),

  // ── Certifications ───────────────────────────────────────────
  getCertifications: (profileId: number) => ipcRenderer.invoke('getCertifications', profileId),
  saveCertification: (cert: any) => ipcRenderer.invoke('saveCertification', cert),
  deleteCertification: (id: number) => ipcRenderer.invoke('deleteCertification', id),

  // ── Applications ─────────────────────────────────────────────
  getApplications: () => ipcRenderer.invoke('getApplications'),
  getApplication: (id: number) => ipcRenderer.invoke('getApplication', id),
  saveApplication: (application: Application) => ipcRenderer.invoke('saveApplication', application),
  updateApplicationStatus: (id: number, status: string) =>
    ipcRenderer.invoke('updateApplicationStatus', id, status),
  deleteApplication: (id: number) => ipcRenderer.invoke('deleteApplication', id),

  // ── AI ───────────────────────────────────────────────────────
  analyzeJob: (description: string) => ipcRenderer.invoke('analyzeJob', description),
  generateCV: (applicationId: number, templateId: string) =>
    ipcRenderer.invoke('generateCV', applicationId, templateId),
  generateCoverLetter: (applicationId: number) =>
    ipcRenderer.invoke('generateCoverLetter', applicationId),
  scoreATS: (cvContent: string, jobDescription: string) =>
    ipcRenderer.invoke('scoreATS', cvContent, jobDescription),
  getDefaultSystemPrompts: () => ipcRenderer.invoke('getDefaultSystemPrompts'),

  // ── Scraper ──────────────────────────────────────────────────
  scrapeJobUrl: (url: string) => ipcRenderer.invoke('scrapeJobUrl', url),
  openLinkedInScraper: (url: string) => ipcRenderer.invoke('openLinkedInScraper', url),
  completeLinkedInScrape: () => ipcRenderer.invoke('completeLinkedInScrape'),
  parseProfileText: (text: string) => ipcRenderer.invoke('parseProfileText', text),
  onParseProfileProgress: (callback: (progress: number) => void) => {
    const subscription = (_event: any, progress: number) => callback(progress);
    ipcRenderer.on('parse-profile-progress', subscription);
    return () => {
      ipcRenderer.removeListener('parse-profile-progress', subscription);
    };
  },

  // ── Export ───────────────────────────────────────────────────
  exportPDF: (html: string, fileName: string, outputDir?: string) =>
    ipcRenderer.invoke('exportPDF', html, fileName, outputDir),
  exportDOCX: (cvData: any, templateId: string, fileName: string, outputDir?: string) =>
    ipcRenderer.invoke('exportDOCX', cvData, templateId, fileName, outputDir),

  // ── CVs ──────────────────────────────────────────────────────
  saveCv: (cv: any) => ipcRenderer.invoke('saveCv', cv),
  getCvs: (applicationId: number) => ipcRenderer.invoke('getCvs', applicationId),
  saveCoverLetter: (cl: any) => ipcRenderer.invoke('saveCoverLetter', cl),
  getCoverLetters: (applicationId: number) => ipcRenderer.invoke('getCoverLetters', applicationId),

  // ── File Dialogs ─────────────────────────────────────────────
  showSaveDialog: (defaultName: string, filters: any[]) =>
    ipcRenderer.invoke('showSaveDialog', defaultName, filters),
  selectDirectory: () => ipcRenderer.invoke('selectDirectory'),
  openPath: (path: string) => ipcRenderer.invoke('openPath', path),

  // ── App Info ─────────────────────────────────────────────────
  isFirstRun: () => ipcRenderer.invoke('isFirstRun'),
  getAppVersion: () => ipcRenderer.sendSync('getAppVersion', null) || '1.0.0'
});
