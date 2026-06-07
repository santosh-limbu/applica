// ============================================================
// Applica — AI Service (Google Gemini)
// ============================================================

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type {
  Profile,
  Experience,
  Education,
  Skill,
  Certification,
  JobAnalysis,
  GeneratedCV,
  ATSScore
} from '../types';

// ── Helpers ──────────────────────────────────────────────────

function createModel(apiKey: string): GenerativeModel {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

/**
 * Try to extract a JSON block from a possibly markdown-fenced response.
 */
function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();
  // Strip markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  return JSON.parse(cleaned) as T;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Validate that an API key can authenticate with Gemini.
 */
export async function testConnection(apiKey: string): Promise<boolean> {
  try {
    const model = createModel(apiKey);
    const result = await model.generateContent('Respond with the single word: OK');
    const text = result.response.text();
    return text.toLowerCase().includes('ok');
  } catch {
    return false;
  }
}

/**
 * Analyse a job description and extract structured information.
 */
export async function analyzeJob(
  apiKey: string,
  description: string
): Promise<JobAnalysis> {
  const model = createModel(apiKey);

  const prompt = `You are an expert career analyst. Analyse the following job description and extract structured information.

IMPORTANT RULES:
- Only extract information that is EXPLICITLY stated or STRONGLY implied in the text.
- Do NOT invent, fabricate, or hallucinate any information.
- If a field cannot be determined, use a sensible default (empty string or empty array).

Return a JSON object with EXACTLY this schema (no additional keys):
{
  "role_title": "string — the job title",
  "company": "string — the company name, or empty string if unknown",
  "seniority_level": "string — one of: entry, junior, mid, senior, lead, principal, executive",
  "required_skills": ["array of required technical & soft skills"],
  "preferred_skills": ["array of nice-to-have skills"],
  "required_experience_years": 0,
  "key_responsibilities": ["array of main responsibilities"],
  "industry": "string — the industry sector",
  "keywords": ["important ATS keywords from the posting"],
  "tone": "string — the tone of the posting: formal, casual, technical, etc.",
  "summary": "string — a 2-3 sentence summary of the role"
}

JOB DESCRIPTION:
${description}`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse<JobAnalysis>(result.response.text());
}

/**
 * Generate a tailored CV based on the candidate profile and a job analysis.
 */
export async function generateCV(
  apiKey: string,
  profile: Profile,
  experiences: Experience[],
  education: Education[],
  skills: Skill[],
  certifications: Certification[],
  jobAnalysis: JobAnalysis,
  templateId: string
): Promise<GeneratedCV> {
  const model = createModel(apiKey);

  const candidateInfo = JSON.stringify(
    { profile, experiences, education, skills, certifications },
    null,
    2
  );
  const jobInfo = JSON.stringify(jobAnalysis, null, 2);

  const writingToneInstruction = profile.writing_samples
    ? `The candidate has provided writing samples below. Match their natural writing tone and vocabulary as closely as possible when crafting the summary and bullet points.

WRITING SAMPLES:
${profile.writing_samples}

`
    : '';

  const prompt = `You are an expert CV writer and career coach. Your task is to generate a tailored, ATS-optimised CV for the candidate targeting a specific role.

CRITICAL RULES:
1. NEVER fabricate, invent, or hallucinate any information. Only use facts from the candidate data provided.
2. Every achievement and metric MUST come from the candidate's existing descriptions/achievements. Do NOT invent numbers.
3. Reword and re-emphasise existing experience to align with the target role's requirements.
4. Use strong action verbs at the start of each bullet point.
5. Where the candidate provides quantified achievements, keep them. Do NOT add fake metrics.
6. Prioritise experiences and skills most relevant to the target role.
7. The professional summary should be 3-4 sentences maximum.
${writingToneInstruction}
CANDIDATE DATA:
${candidateInfo}

TARGET ROLE ANALYSIS:
${jobInfo}

TEMPLATE STYLE: ${templateId}

Return a JSON object with EXACTLY this schema:
{
  "professional_summary": "string — tailored professional summary (3-4 sentences)",
  "experiences": [
    {
      "company": "string",
      "role": "string — the candidate's actual role title",
      "start_date": "string",
      "end_date": "string or null",
      "tailored_bullets": ["array of 3-5 achievement-focused bullet points per role, tailored to the target job"]
    }
  ],
  "skills_highlight": ["array of the most relevant skills to showcase, ordered by relevance"],
  "content_html": "string — full CV content as clean HTML suitable for the ${templateId} template. Use semantic HTML: h1 for name, h2 for section headers, ul/li for bullets, p for text."
}`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse<GeneratedCV>(result.response.text());
}

/**
 * Generate a tailored cover letter.
 */
export async function generateCoverLetter(
  apiKey: string,
  profile: Profile,
  experiences: Experience[],
  jobAnalysis: JobAnalysis
): Promise<string> {
  const model = createModel(apiKey);

  const writingToneInstruction = profile.writing_samples
    ? `The candidate has provided writing samples. Match their natural voice, tone, and vocabulary:

WRITING SAMPLES:
${profile.writing_samples}

`
    : '';

  const prompt = `You are an expert cover letter writer. Generate a professional cover letter for the candidate targeting the specified role.

CRITICAL RULES:
1. NEVER fabricate or hallucinate any information. Only reference real experience from the candidate data.
2. The letter should be 3-4 paragraphs: opening hook, relevant experience alignment, enthusiasm & closing.
3. Reference specific experiences and achievements from the candidate's background that match the role.
4. Do NOT use generic filler phrases like "I am a highly motivated professional."
5. Address the letter appropriately (use company name and role title).
6. Keep total length under 400 words.
${writingToneInstruction}
CANDIDATE:
Name: ${profile.full_name}
Summary: ${profile.professional_summary ?? ''}
Experience: ${JSON.stringify(experiences.map((e) => ({ company: e.company, role: e.role, achievements: e.achievements })))}

TARGET ROLE:
Title: ${jobAnalysis.role_title}
Company: ${jobAnalysis.company}
Key Requirements: ${jobAnalysis.required_skills.join(', ')}
Responsibilities: ${jobAnalysis.key_responsibilities.join('; ')}

Return ONLY the cover letter text (plain text with paragraph breaks). Do NOT wrap in JSON or code fences.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Score a CV against a job description for ATS compatibility.
 */
export async function scoreATS(
  apiKey: string,
  cvContent: string,
  jobDescription: string
): Promise<ATSScore> {
  const model = createModel(apiKey);

  const prompt = `You are an ATS (Applicant Tracking System) scoring engine. Evaluate how well the given CV matches the job description.

Score the CV on these dimensions (0-100 each):
- keyword_match_score: How many important keywords from the JD appear in the CV?
- format_score: Is the CV well-structured with clear sections, no tables/images that confuse ATS?
- content_score: Does the CV demonstrate relevant experience and qualifications?
- overall_score: Weighted average (keyword 40%, content 40%, format 20%)

Return a JSON object with EXACTLY this schema:
{
  "overall_score": 0,
  "keyword_match_score": 0,
  "format_score": 0,
  "content_score": 0,
  "matched_keywords": ["keywords found in both CV and JD"],
  "missing_keywords": ["important JD keywords NOT found in the CV"],
  "suggestions": ["3-5 actionable suggestions to improve the ATS score"]
}

CV CONTENT:
${cvContent}

JOB DESCRIPTION:
${jobDescription}`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse<ATSScore>(result.response.text());
}
