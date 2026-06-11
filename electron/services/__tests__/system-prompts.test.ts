import { describe, it, expect } from 'vitest';
import {
  getJobAnalysisSystemPrompt,
  getCVGenerationSystemPrompt,
  getCoverLetterSystemPrompt,
  getATSScoringSystemPrompt
} from '../system-prompts';
import type { Profile } from '../../types';

describe('System Prompts Builder', () => {
  describe('getJobAnalysisSystemPrompt', () => {
    it('should return a system prompt containing expert career consultant identity', () => {
      const prompt = getJobAnalysisSystemPrompt();
      expect(prompt).toContain('You are an expert, analytical career consultant');
      expect(prompt).toContain('extract structured, high-accuracy information');
    });
  });

  describe('getCVGenerationSystemPrompt', () => {
    it('should return system prompt for CV generation with candidate context and without writing samples', () => {
      const profile: Profile = {
        full_name: 'John Doe',
        professional_summary: 'Experienced software engineer specializing in Cloud.'
      };
      const prompt = getCVGenerationSystemPrompt(profile);
      expect(prompt).toContain('CANDIDATE IDENTITY & FOCUS:');
      expect(prompt).toContain('Candidate Name: John Doe');
      expect(prompt).toContain('Existing Summary: Experienced software engineer specializing in Cloud.');
      expect(prompt).toContain('You are an expert CV writer and professional career coach');
      expect(prompt).not.toContain('WRITING TONE & STYLE');
    });

    it('should include writing samples in the system prompt if present', () => {
      const profile: Profile = {
        full_name: 'John Doe',
        writing_samples: 'I code in TypeScript daily. I enjoy building things.',
      };
      const prompt = getCVGenerationSystemPrompt(profile);
      expect(prompt).toContain('You are an expert CV writer and professional career coach');
      expect(prompt).toContain('WRITING TONE & STYLE');
      expect(prompt).toContain('I code in TypeScript daily. I enjoy building things.');
    });
  });

  describe('getCoverLetterSystemPrompt', () => {
    it('should return system prompt for Cover Letter with candidate context and without writing samples', () => {
      const profile: Profile = {
        full_name: 'Jane Smith',
        professional_summary: 'Creative UX designer focused on accessibility.'
      };
      const prompt = getCoverLetterSystemPrompt(profile);
      expect(prompt).toContain('CANDIDATE IDENTITY:');
      expect(prompt).toContain('Candidate Name: Jane Smith');
      expect(prompt).toContain('Existing Summary: Creative UX designer focused on accessibility.');
      expect(prompt).toContain('You are an expert cover letter writer and executive career coach');
      expect(prompt).not.toContain('WRITING TONE & STYLE');
    });

    it('should include writing samples in the system prompt if present', () => {
      const profile: Profile = {
        full_name: 'Jane Smith',
        writing_samples: 'Always professional and structured, using active verbs.',
      };
      const prompt = getCoverLetterSystemPrompt(profile);
      expect(prompt).toContain('You are an expert cover letter writer and executive career coach');
      expect(prompt).toContain('WRITING TONE & STYLE');
      expect(prompt).toContain('Always professional and structured, using active verbs.');
    });
  });

  describe('getATSScoringSystemPrompt', () => {
    it('should return system prompt with ATS identity and dimensions', () => {
      const prompt = getATSScoringSystemPrompt();
      expect(prompt).toContain('You are a strict, objective, and realistic Applicant Tracking System (ATS)');
      expect(prompt).toContain('keyword_match_score');
      expect(prompt).toContain('format_score');
      expect(prompt).toContain('content_score');
      expect(prompt).toContain('overall_score');
    });
  });
});
