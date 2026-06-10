// ============================================================
// Applica — Shared Types for Electron Main Process
// ============================================================

// ── Database Models ──────────────────────────────────────────

export interface Profile {
  id?: number;
  full_name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  professional_summary?: string;
  writing_samples?: string;
  references?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Experience {
  id?: number;
  profile_id: number;
  company: string;
  role: string;
  start_date: string;
  end_date?: string;
  location?: string;
  description?: string;
  achievements?: string;
  sort_order?: number;
  created_at?: string;
}

export interface Education {
  id?: number;
  profile_id: number;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
  description?: string;
  sort_order?: number;
  created_at?: string;
}

export interface Skill {
  id?: number;
  profile_id: number;
  name: string;
  category?: string;
  proficiency?: string;
  created_at?: string;
}

export interface Certification {
  id?: number;
  profile_id: number;
  name: string;
  issuer?: string;
  date_obtained?: string;
  expiry_date?: string;
  credential_url?: string;
  created_at?: string;
}

export interface Application {
  id?: number;
  profile_id: number;
  company: string;
  role_title: string;
  job_description?: string;
  job_url?: string;
  status?: 'draft' | 'applied' | 'interview' | 'rejected' | 'offer' | 'accepted' | 'withdrawn';
  applied_date?: string;
  salary_range?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  notes?: string;
  ats_score?: number;
  ai_analysis?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CV {
  id?: number;
  application_id?: number;
  profile_id: number;
  title: string;
  template_id: string;
  content: string;
  version?: number;
  is_latest?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CoverLetter {
  id?: number;
  application_id?: number;
  profile_id: number;
  content: string;
  version?: number;
  is_latest?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Reminder {
  id?: number;
  application_id: number;
  remind_at: string;
  message?: string;
  is_completed?: number;
  created_at?: string;
}

// ── AI Types ─────────────────────────────────────────────────

export interface JobAnalysis {
  role_title: string;
  company: string;
  seniority_level: string;
  experience_level: string;
  required_skills: string[];
  preferred_skills: string[];
  required_experience_years: number;
  key_responsibilities: string[];
  qualifications: string[];
  keywords: string[];
  industry: string;
  tone: string;
  summary: string;
  salary_range?: string;
  location?: string;
}

export interface GeneratedCV {
  professional_summary: string;
  experiences: GeneratedExperience[];
  skills_highlight: string[];
  content_html: string;
}

export interface GeneratedExperience {
  company: string;
  role: string;
  start_date: string;
  end_date?: string;
  tailored_bullets: string[];
}

export interface ATSScore {
  overall_score: number;
  keyword_match_score: number;
  format_score: number;
  content_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  suggestions: string[];
}

// ── Scraper Types ────────────────────────────────────────────

export interface ScrapedJob {
  title: string;
  company: string;
  description: string;
  location?: string;
  salary?: string;
  url: string;
}

// ── Export Types ──────────────────────────────────────────────

export interface CVExportData {
  profile: Profile;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  professional_summary: string;
}
