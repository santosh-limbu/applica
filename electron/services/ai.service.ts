// ============================================================
// Applica — AI Service (Provider-Agnostic)
// ============================================================
// All AI features route through the active provider via the
// AIProvider interface. Prompts are model-agnostic.

import type { AIProvider, ProviderConfig } from './ai-provider.interface';
import { AVAILABLE_PROVIDERS } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAICompatProvider } from './openai-compat.provider';
import * as db from './database.service';
import * as storage from './storage.service';
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

// ── Provider Factory ─────────────────────────────────────────

/**
 * Read the saved provider config from the DB and construct the
 * appropriate AIProvider instance.
 */
export function getActiveProvider(): AIProvider {
  const config = getProviderConfig();

  switch (config.provider) {
    case 'gemini': {
      const apiKey = config.apiKey || storage.getApiKey();
      if (!apiKey) {
        throw new Error('No Gemini API key configured. Please add your API key in Settings.');
      }
      return new GeminiProvider(apiKey, config.model || 'gemini-2.0-flash');
    }

    case 'ollama': {
      const endpoint = config.endpoint || 'http://localhost:11434';
      const model = config.model || 'llama3.2';
      return new OpenAICompatProvider(endpoint, model, undefined, 'Ollama');
    }

    case 'openai-compat': {
      const endpoint = config.endpoint || 'http://localhost:1234';
      const model = config.model || 'default';
      return new OpenAICompatProvider(endpoint, model, config.apiKey, 'OpenAI Compatible');
    }

    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

/**
 * Build a temporary provider from an arbitrary config (for testing
 * connections before saving).
 */
export function createProviderFromConfig(config: ProviderConfig): AIProvider {
  switch (config.provider) {
    case 'gemini': {
      if (!config.apiKey) throw new Error('Gemini requires an API key.');
      return new GeminiProvider(config.apiKey, config.model || 'gemini-2.0-flash');
    }
    case 'ollama': {
      return new OpenAICompatProvider(
        config.endpoint || 'http://localhost:11434',
        config.model || 'llama3.2',
        undefined,
        'Ollama'
      );
    }
    case 'openai-compat': {
      return new OpenAICompatProvider(
        config.endpoint || 'http://localhost:1234',
        config.model || 'default',
        config.apiKey,
        'OpenAI Compatible'
      );
    }
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// ── Config persistence ───────────────────────────────────────

export function getProviderConfig(): ProviderConfig {
  const provider = (db.getSetting('ai_provider') as ProviderConfig['provider']) || 'ollama';
  const endpoint = db.getSetting('ai_endpoint') || undefined;
  const model = db.getSetting('ai_model') || undefined;
  const apiKey = provider === 'gemini' ? storage.getApiKey() || undefined : (db.getSetting('ai_api_key') || undefined);

  return { provider, endpoint, model, apiKey };
}

export function saveProviderConfig(config: ProviderConfig): void {
  db.setSetting('ai_provider', config.provider);

  if (config.endpoint) {
    db.setSetting('ai_endpoint', config.endpoint);
  }
  if (config.model) {
    db.setSetting('ai_model', config.model);
  }

  // For Gemini, store key in secure storage; for others, in settings
  if (config.provider === 'gemini' && config.apiKey) {
    storage.saveApiKey(config.apiKey);
  } else if (config.apiKey) {
    db.setSetting('ai_api_key', config.apiKey);
  }
}

// ── Helpers ──────────────────────────────────────────────────

function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();

  // 1. Remove thinking/reasoning blocks (e.g., <think>...</think>) commonly output by reasoning models
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Try to match markdown code block fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // 3. Fallback: extract the JSON object bounded by the first '{' and last '}'
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1).trim();
  }

  // 4. Strip single-line (//) and multi-line (/* */) comments that local LLMs might hallucinate inside the JSON
  cleaned = cleaned
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

  // 5. Repair trailing commas inside arrays or objects (common LLM formatting slip-up)
  cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('[ai.service:parseJsonResponse] JSON parsing failed.');
    console.error('Raw LLM Response text was:', text);
    console.error('Cleaned text targeted for parsing was:', cleaned);
    throw new Error(`Invalid JSON format returned by AI: ${(err as Error).message}`);
  }
}

// ── Public API (unchanged signatures for IPC layer) ──────────

export async function testConnection(apiKey: string): Promise<boolean> {
  // Legacy method for backwards compat — tests Gemini specifically
  try {
    const provider = new GeminiProvider(apiKey);
    return await provider.testConnection();
  } catch {
    return false;
  }
}

export async function testProviderConnection(config: ProviderConfig): Promise<boolean> {
  try {
    const provider = createProviderFromConfig(config);
    return await provider.testConnection();
  } catch {
    return false;
  }
}

export async function listProviderModels(config: ProviderConfig): Promise<string[]> {
  try {
    const provider = createProviderFromConfig(config);
    return await provider.listModels();
  } catch {
    return [];
  }
}

export async function analyzeJob(
  _apiKeyOrIgnored: string,
  description: string
): Promise<JobAnalysis> {
  const provider = getActiveProvider();

  const prompt = `You are an expert career analyst. Analyse the following job description and extract structured information.

IMPORTANT RULES:
- Only extract information that is EXPLICITLY stated or STRONGLY implied in the text.
- Do NOT invent, fabricate, or hallucinate any information.
- If a field cannot be determined, use a sensible default (empty string or empty array).

Return a JSON object with EXACTLY this schema (no additional keys):
{
  "role_title": "string — the job title",
  "company": "string — the company name, or empty string if unknown",
  "experience_level": "string — one of: entry, junior, mid, senior, lead, principal, executive",
  "seniority_level": "string — same as experience_level",
  "required_skills": ["array of required technical & soft skills"],
  "preferred_skills": ["array of nice-to-have skills"],
  "required_experience_years": 0,
  "key_responsibilities": ["array of main responsibilities"],
  "qualifications": ["array of required academic/professional qualifications, degrees, or certifications"],
  "industry": "string — the industry sector",
  "keywords": ["important ATS keywords from the posting"],
  "tone": "string — the tone of the posting: formal, casual, technical, etc.",
  "summary": "string — a 2-3 sentence summary of the role",
  "salary_range": "string — the salary range if stated, or empty string if unknown",
  "location": "string — the job location if stated, or empty string if unknown"
}

JOB DESCRIPTION:
${description}`;

  const text = await provider.generateText(prompt);
  return parseJsonResponse<JobAnalysis>(text);
}

export async function generateCV(
  _apiKeyOrIgnored: string,
  profile: Profile,
  experiences: Experience[],
  education: Education[],
  skills: Skill[],
  certifications: Certification[],
  jobAnalysis: JobAnalysis,
  templateId: string
): Promise<GeneratedCV> {
  const provider = getActiveProvider();

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
8. If the candidate data includes a 'references' field in their profile, format and append a "References" section at the very end of the 'content_html' (under a header like "References" or "Professional References"). If references are empty or not provided, write "References available upon request" or omit this section depending on spacing.
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

  const text = await provider.generateText(prompt);
  return parseJsonResponse<GeneratedCV>(text);
}

export async function generateCoverLetter(
  _apiKeyOrIgnored: string,
  profile: Profile,
  experiences: Experience[],
  jobAnalysis: JobAnalysis
): Promise<string> {
  const provider = getActiveProvider();

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

  const text = await provider.generateText(prompt);
  return text.trim();
}

export async function scoreATS(
  _apiKeyOrIgnored: string,
  cvContent: string,
  jobDescription: string
): Promise<ATSScore> {
  const provider = getActiveProvider();

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

  const text = await provider.generateText(prompt);
  return parseJsonResponse<ATSScore>(text);
}
