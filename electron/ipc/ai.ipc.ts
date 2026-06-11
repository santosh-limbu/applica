// ============================================================
// Applica — AI IPC Handlers
// ============================================================

import { ipcMain } from 'electron';
import * as ai from '../services/ai.service';
import * as db from '../services/database.service';
import * as storage from '../services/storage.service';
import {
  DEFAULT_JOB_ANALYSIS_PROMPT,
  DEFAULT_CV_GEN_PROMPT,
  DEFAULT_COVER_LETTER_PROMPT,
  DEFAULT_ATS_SCORING_PROMPT
} from '../services/system-prompts';

export function registerAiHandlers(): void {
  // ── Analyse Job Description ──────────────────────────────────

  ipcMain.handle('analyzeJob', async (_event, description: string) => {
    try {
      const apiKey = storage.getApiKey() || '';
      return await ai.analyzeJob(apiKey, description);
    } catch (err) {
      console.error('[IPC:analyzeJob]', err);
      throw new Error(`Job analysis failed: ${(err as Error).message}`);
    }
  });

  // ── Generate CV ──────────────────────────────────────────────

  ipcMain.handle('generateCV', async (_event, applicationId: number, templateId: string) => {
    try {
      const apiKey = storage.getApiKey() || '';

      const application = db.getApplicationById(applicationId);
      if (!application) throw new Error('Application not found');

      const profile = db.getProfileById(application.profile_id);
      if (!profile) throw new Error('Profile not found');

      const experiences = db.getExperiences(profile.id!);
      const education = db.getEducation(profile.id!);
      const skills = db.getSkills(profile.id!);
      const certifications = db.getCertifications(profile.id!);

      // Get or create job analysis
      let jobAnalysis = application.ai_analysis
        ? JSON.parse(application.ai_analysis)
        : null;

      if (!jobAnalysis && application.job_description) {
        jobAnalysis = await ai.analyzeJob(apiKey, application.job_description);
        // Persist the analysis for future use
        db.saveApplication({
          ...application,
          ai_analysis: JSON.stringify(jobAnalysis)
        });
      }

      if (!jobAnalysis) {
        throw new Error('No job description available to generate a tailored CV.');
      }

      const generated = await ai.generateCV(
        apiKey,
        profile,
        experiences,
        education,
        skills,
        certifications,
        jobAnalysis,
        templateId
      );

      // Auto-save the generated CV
      db.saveCv({
        application_id: applicationId,
        profile_id: profile.id!,
        title: `${application.role_title} at ${application.company}`,
        template_id: templateId,
        content: JSON.stringify(generated)
      });

      // Auto-run ATS scoring on the generated CV content
      if (application.job_description) {
        try {
          const atsResult = await ai.scoreATS(apiKey, generated.content_html, application.job_description);
          db.saveApplication({
            ...application,
            ats_score: atsResult.overall_score,
            ats_score_details: JSON.stringify(atsResult)
          });
        } catch (atsErr) {
          console.error('[IPC:generateCV] ATS scoring failed:', atsErr);
        }
      }

      return generated;
    } catch (err) {
      console.error('[IPC:generateCV]', err);
      throw new Error(`CV generation failed: ${(err as Error).message}`);
    }
  });

  // ── Generate Cover Letter ────────────────────────────────────

  ipcMain.handle('generateCoverLetter', async (_event, applicationId: number) => {
    try {
      const apiKey = storage.getApiKey() || '';

      const application = db.getApplicationById(applicationId);
      if (!application) throw new Error('Application not found');

      const profile = db.getProfileById(application.profile_id);
      if (!profile) throw new Error('Profile not found');

      const experiences = db.getExperiences(profile.id!);
      const education = db.getEducation(profile.id!);
      const certifications = db.getCertifications(profile.id!);

      let jobAnalysis = application.ai_analysis
        ? JSON.parse(application.ai_analysis)
        : null;

      if (!jobAnalysis && application.job_description) {
        jobAnalysis = await ai.analyzeJob(apiKey, application.job_description);
        db.saveApplication({
          ...application,
          ai_analysis: JSON.stringify(jobAnalysis)
        });
      }

      if (!jobAnalysis) {
        throw new Error('No job description available to generate a cover letter.');
      }

      const letter = await ai.generateCoverLetter(
        apiKey,
        profile,
        experiences,
        jobAnalysis,
        education,
        certifications
      );

      // Auto-save the cover letter
      db.saveCoverLetter({
        application_id: applicationId,
        profile_id: profile.id!,
        content: letter
      });

      return letter;
    } catch (err) {
      console.error('[IPC:generateCoverLetter]', err);
      return { success: false, error: `Cover letter generation failed: ${(err as Error).message}` };
    }
  });

  // ── ATS Score ────────────────────────────────────────────────

  ipcMain.handle(
    'scoreATS',
    async (_event, cvContent: string, jobDescription: string) => {
      try {
        const apiKey = storage.getApiKey() || '';
        return await ai.scoreATS(apiKey, cvContent, jobDescription);
      } catch (err) {
        console.error('[IPC:scoreATS]', err);
        throw new Error(`ATS scoring failed: ${(err as Error).message}`);
      }
    }
  );

  ipcMain.handle('getDefaultSystemPrompts', () => {
    return {
      prompt_job_analysis: DEFAULT_JOB_ANALYSIS_PROMPT,
      prompt_cv_generation: DEFAULT_CV_GEN_PROMPT,
      prompt_cover_letter: DEFAULT_COVER_LETTER_PROMPT,
      prompt_ats_scoring: DEFAULT_ATS_SCORING_PROMPT
    };
  });
}
