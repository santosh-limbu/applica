export interface Profile {
  id?: number
  full_name: string
  email?: string
  phone?: string
  location?: string
  linkedin_url?: string
  portfolio_url?: string
  professional_summary?: string
  writing_samples?: string
  references?: string
  created_at?: string
  updated_at?: string
}

export interface Experience {
  id?: number
  profile_id: number
  company: string
  role: string
  start_date: string
  end_date?: string
  location?: string
  description?: string
  achievements?: string // JSON array
  sort_order?: number
}

export interface Education {
  id?: number
  profile_id: number
  institution: string
  degree: string
  field_of_study?: string
  start_date?: string
  end_date?: string
  grade?: string
  description?: string
  sort_order?: number
}

export interface Skill {
  id?: number
  profile_id: number
  name: string
  category?: string
  proficiency?: string
}

export interface Certification {
  id?: number
  profile_id: number
  name: string
  issuer?: string
  date_obtained?: string
  expiry_date?: string
  credential_url?: string
}

export interface Application {
  id?: number
  profile_id: number
  company: string
  role_title: string
  job_description?: string
  job_url?: string
  status?: 'draft' | 'applied' | 'interview' | 'rejected' | 'offer' | 'accepted' | 'withdrawn'
  applied_date?: string
  salary_range?: string
  recruiter_name?: string
  recruiter_email?: string
  notes?: string
  ats_score?: number
  ai_analysis?: string
  created_at?: string
  updated_at?: string
}

export interface CV {
  id?: number
  application_id?: number
  profile_id: number
  title: string
  template_id: string
  content: string // TipTap JSON
  version?: number
  is_latest?: number
}

export interface CoverLetter {
  id?: number
  application_id?: number
  profile_id: number
  content: string
  version?: number
  is_latest?: number
  created_at?: string
  updated_at?: string
}

export interface JobAnalysis {
  role_title: string
  company: string
  seniority_level: string
  experience_level: string
  required_skills: string[]
  preferred_skills: string[]
  required_experience_years: number
  key_responsibilities: string[]
  qualifications: string[]
  keywords: string[]
  industry: string
  tone: string
  summary: string
  salary_range?: string
  location?: string
}

export interface ATSScore {
  overall_score: number
  keyword_match: number
  experience_match: number
  skills_match: number
  education_match: number
  suggestions: string[]
  missing_keywords: string[]
  strong_matches: string[]
}

export interface ScrapedJob {
  title: string
  company: string
  description: string
  salary?: string
  location?: string
  url: string
}

export interface ProviderConfig {
  provider: 'gemini' | 'ollama' | 'openai-compat'
  apiKey?: string
  endpoint?: string
  model?: string
}

export interface ProviderInfo {
  id: 'gemini' | 'ollama' | 'openai-compat'
  name: string
  description: string
  defaultEndpoint?: string
  requiresApiKey: boolean
  icon: string
}

export interface GeneratedCV {
  title?: string
  professional_summary: string
  experiences?: any[]
  skills_highlight?: string[]
  content_html: string
}

export interface CVSection {
  type: 'experience' | 'education' | 'skills' | 'certifications' | 'summary'
  title: string
  items: any[]
}

// Extend Window for IPC
declare global {
  interface Window {
    api: ElectronAPI
  }
}

export interface ElectronAPI {
  getSettings: (key: string) => Promise<string | null>
  setSettings: (key: string, value: string) => Promise<void>
  saveApiKey: (key: string) => Promise<void>
  getApiKey: () => Promise<string | null>
  testApiKey: (key: string) => Promise<boolean>
  getAvailableProviders: () => Promise<ProviderInfo[]>
  getProviderConfig: () => Promise<ProviderConfig>
  saveProviderConfig: (config: ProviderConfig) => Promise<void>
  testProviderConnection: (config: ProviderConfig) => Promise<boolean>
  listProviderModels: (config: ProviderConfig) => Promise<string[]>
  getProfile: () => Promise<Profile | null>
  saveProfile: (profile: Profile) => Promise<Profile>
  getExperiences: (profileId: number) => Promise<Experience[]>
  saveExperience: (exp: Experience) => Promise<Experience>
  deleteExperience: (id: number) => Promise<void>
  getEducation: (profileId: number) => Promise<Education[]>
  saveEducation: (edu: Education) => Promise<Education>
  deleteEducation: (id: number) => Promise<void>
  getSkills: (profileId: number) => Promise<Skill[]>
  saveSkill: (skill: Skill) => Promise<Skill>
  deleteSkill: (id: number) => Promise<void>
  getCertifications: (profileId: number) => Promise<Certification[]>
  saveCertification: (cert: Certification) => Promise<Certification>
  deleteCertification: (id: number) => Promise<void>
  getApplications: () => Promise<Application[]>
  getApplication: (id: number) => Promise<Application | null>
  saveApplication: (app: Application) => Promise<Application>
  updateApplicationStatus: (id: number, status: string) => Promise<void>
  deleteApplication: (id: number) => Promise<void>
  analyzeJob: (description: string) => Promise<JobAnalysis>
  generateCV: (applicationId: number, templateId: string) => Promise<GeneratedCV>
  generateCoverLetter: (applicationId: number) => Promise<string>
  scoreATS: (cvContent: string, jobDescription: string) => Promise<ATSScore>
  scrapeJobUrl: (url: string) => Promise<ScrapedJob>
  exportPDF: (html: string, fileName: string, outputDir?: string) => Promise<string | null>
  exportDOCX: (cvData: any, templateId: string, fileName: string, outputDir?: string) => Promise<string | null>
  saveCv: (cv: CV) => Promise<CV>
  getCvs: (applicationId: number) => Promise<CV[]>
  saveCoverLetter: (cl: CoverLetter) => Promise<CoverLetter>
  getCoverLetters: (applicationId: number) => Promise<CoverLetter[]>
  showSaveDialog: (defaultName: string, filters: any[]) => Promise<string | null>
  selectDirectory: () => Promise<string | null>
  openPath: (path: string) => Promise<boolean>
  isFirstRun: () => Promise<boolean>
  getAppVersion: () => string
}
