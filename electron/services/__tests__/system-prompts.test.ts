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
    it('should return a system prompt containing expert career analyst identity', () => {
      const prompt = getJobAnalysisSystemPrompt();
      expect(prompt).toContain('You are an expert career analyst');
      expect(prompt).toContain('extract structured information');
    });
  });

  describe('getCVGenerationSystemPrompt', () => {
    it('should return system prompt for CV generation without writing samples', () => {
      const profile: Profile = {
        full_name: 'John Doe',
      };
      const prompt = getCVGenerationSystemPrompt(profile);
      expect(prompt).toContain('You are an expert CV writer and career coach');
      expect(prompt).not.toContain('WRITING TONE & STYLE');
    });

    it('should include writing samples in the system prompt if present', () => {
      const profile: Profile = {
        full_name: 'John Doe',
        writing_samples: 'I code in TypeScript daily. I enjoy building things.',
      };
      const prompt = getCVGenerationSystemPrompt(profile);
      expect(prompt).toContain('You are an expert CV writer and career coach');
      expect(prompt).toContain('WRITING TONE & STYLE');
      expect(prompt).toContain('I code in TypeScript daily. I enjoy building things.');
    });
  });

  describe('getCoverLetterSystemPrompt', () => {
    it('should return system prompt for Cover Letter without writing samples', () => {
      const profile: Profile = {
        full_name: 'Jane Smith',
      };
      const prompt = getCoverLetterSystemPrompt(profile);
      expect(prompt).toContain('You are an expert cover letter writer');
      expect(prompt).not.toContain('WRITING TONE & STYLE');
    });

    it('should include writing samples in the system prompt if present', () => {
      const profile: Profile = {
        full_name: 'Jane Smith',
        writing_samples: 'Always professional and structured, using active verbs.',
      };
      const prompt = getCoverLetterSystemPrompt(profile);
      expect(prompt).toContain('You are an expert cover letter writer');
      expect(prompt).toContain('WRITING TONE & STYLE');
      expect(prompt).toContain('Always professional and structured, using active verbs.');
    });
  });

  describe('getATSScoringSystemPrompt', () => {
    it('should return system prompt with ATS identity and dimensions', () => {
      const prompt = getATSScoringSystemPrompt();
      expect(prompt).toContain('You are an objective, strict Applicant Tracking System (ATS) scoring engine');
      expect(prompt).toContain('keyword_match_score');
      expect(prompt).toContain('format_score');
      expect(prompt).toContain('content_score');
      expect(prompt).toContain('overall_score');
    });
  });
});
