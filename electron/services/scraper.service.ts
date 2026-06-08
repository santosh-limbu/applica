// ============================================================
// Applica — Job Scraper Service (axios + cheerio)
// ============================================================

import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedJob } from "../types";

const REQUEST_TIMEOUT = 15_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/**
 * Fetch a job posting URL and extract structured data.
 */
export async function scrapeJobUrl(url: string): Promise<ScrapedJob> {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  // Remove scripts, styles, navs, footers to reduce noise
  $("script, style, nav, footer, header, iframe, noscript").remove();

  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes("linkedin.com")) {
    return scrapeLinkedIn($, url);
  }
  if (hostname.includes("indeed.com")) {
    return scrapeIndeed($, url);
  }
  if (hostname.includes("glassdoor.com")) {
    return scrapeGlassdoor($, url);
  }

  // Generic fallback
  return scrapeGeneric($, url);
}

// ── HTTP Fetch ───────────────────────────────────────────────

async function fetchPage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      maxRedirects: 5,
      responseType: "text",
    });
    return response.data as string;
  } catch (err: unknown) {
    const error = err as {
      response?: { status?: number };
      code?: string;
      message?: string;
    };
    if (error.response?.status === 403) {
      throw new Error(
        "Access denied (403). The site may be blocking automated requests. Try copying the job description manually.",
      );
    }
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timed out. The site took too long to respond.");
    }
    throw new Error(
      `Failed to fetch the page: ${error.message ?? "Unknown error"}`,
    );
  }
}

// ── LinkedIn ─────────────────────────────────────────────────

function scrapeLinkedIn($: cheerio.CheerioAPI, url: string): ScrapedJob {
  const bodyText = $("body").text();
  const title =
    $("h1.top-card-layout__title").text().trim() ||
    $("h1.topcard__title").text().trim() ||
    $("h1").first().text().trim();

  const company =
    $("a.topcard__org-name-link").text().trim() ||
    $("span.topcard__flavor").first().text().trim() ||
    $('a[data-tracking-control-name="public_jobs_topcard-org-name"]')
      .text()
      .trim() ||
    "";

  const location =
    $("span.topcard__flavor--bullet").text().trim() ||
    $("span.topcard__flavor").eq(1).text().trim() ||
    "";

  const description =
    $("div.show-more-less-html__markup").text().trim() ||
    $("div.description__text").text().trim() ||
    $("section.description").text().trim() ||
    "";

  const salary = extractSalaryFromText(bodyText);

  return {
    title: title || "Unknown Title",
    company: company || "Unknown Company",
    description: description || bodyText.substring(0, 5000).trim(),
    location: location || undefined,
    salary: salary || undefined,
    url,
  };
}

// ── Indeed ────────────────────────────────────────────────────

function scrapeIndeed($: cheerio.CheerioAPI, url: string): ScrapedJob {
  const bodyText = $("body").text();
  const title =
    $("h1.jobsearch-JobInfoHeader-title").text().trim() ||
    $('[data-testid="jobsearch-JobInfoHeader-title"]').text().trim() ||
    $("h1").first().text().trim();

  const company =
    $('[data-testid="inlineHeader-companyName"]').text().trim() ||
    $("div.jobsearch-InlineCompanyRating a").first().text().trim() ||
    "";

  const location =
    $('[data-testid="inlineHeader-companyLocation"]').text().trim() ||
    $("div.jobsearch-InlineCompanyRating div").last().text().trim() ||
    "";

  const description =
    $("div#jobDescriptionText").text().trim() ||
    $("div.jobsearch-jobDescriptionText").text().trim() ||
    "";

  const salary =
    $("div#salaryInfoAndJobType span.css-19j1a75").text().trim() ||
    extractSalaryFromText(bodyText);

  return {
    title: title || "Unknown Title",
    company: company || "Unknown Company",
    description: description || bodyText.substring(0, 5000).trim(),
    location: location || undefined,
    salary: salary || undefined,
    url,
  };
}

// ── Glassdoor ────────────────────────────────────────────────

function scrapeGlassdoor($: cheerio.CheerioAPI, url: string): ScrapedJob {
  const bodyText = $("body").text();
  const title =
    $('h1[data-test="jobTitle"]').text().trim() ||
    $("div.css-17x2pwl").text().trim() ||
    $("h1").first().text().trim();

  const company =
    $('div[data-test="employerName"]').text().trim() ||
    $("span.css-87uc0g").text().trim() ||
    "";

  const location =
    $('div[data-test="location"]').text().trim() ||
    $("span.css-56kyx5").text().trim() ||
    "";

  const description =
    $("div.jobDescriptionContent").text().trim() ||
    $('div[data-test="jobDescription"]').text().trim() ||
    $("div.desc").text().trim() ||
    "";

  const salary =
    $('div[data-test="detailSalary"]').text().trim() ||
    extractSalaryFromText(bodyText);

  return {
    title: title || "Unknown Title",
    company: company || "Unknown Company",
    description: description || bodyText.substring(0, 5000).trim(),
    location: location || undefined,
    salary: salary || undefined,
    url,
  };
}

// ── Generic ──────────────────────────────────────────────────

function scrapeGeneric($: cheerio.CheerioAPI, url: string): ScrapedJob {
  const bodyText = $("body").text();
  // Try common selectors and structured data
  const ldJson = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => {
      try {
        return JSON.parse($(el).html() || "");
      } catch {
        return null;
      }
    })
    .find(
      (obj) =>
        obj &&
        (obj["@type"] === "JobPosting" ||
          (Array.isArray(obj["@graph"]) &&
            obj["@graph"].some(
              (g: Record<string, unknown>) => g["@type"] === "JobPosting",
            ))),
    );

  if (ldJson) {
    const job =
      ldJson["@type"] === "JobPosting"
        ? ldJson
        : ldJson["@graph"]?.find(
            (g: Record<string, unknown>) => g["@type"] === "JobPosting",
          );

    if (job) {
      return {
        title: job.title || "Unknown Title",
        company:
          (typeof job.hiringOrganization === "string"
            ? job.hiringOrganization
            : job.hiringOrganization?.name) || "Unknown Company",
        description: stripHtml(job.description || ""),
        location:
          typeof job.jobLocation === "string"
            ? job.jobLocation
            : job.jobLocation?.address?.addressLocality || undefined,
        salary: job.baseSalary
          ? `${job.baseSalary.value?.minValue ?? ""}–${job.baseSalary.value?.maxValue ?? ""} ${job.baseSalary.currency ?? ""}`
          : undefined,
        url,
      };
    }
  }

  // Heuristic DOM scraping
  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim().split("|")[0]?.trim() ||
    "Unknown Title";

  // Try to find company from meta tags or common patterns
  const company =
    $('meta[property="og:site_name"]').attr("content")?.trim() ||
    $('meta[name="author"]').attr("content")?.trim() ||
    "";

  // Grab the largest text block as description
  let description = "";
  $(
    'article, [role="main"], main, .job-description, .description, #job-description',
  ).each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > description.length) {
      description = text;
    }
  });

  if (!description) {
    description = bodyText.substring(0, 5000).trim();
  }

  const salary = extractSalaryFromText(bodyText);

  return {
    title,
    company: company || "Unknown Company",
    description,
    location: undefined,
    salary: salary || undefined,
    url,
  };
}

// ── Utilities ────────────────────────────────────────────────

function extractSalaryFromText(text: string): string | undefined {
  // Match patterns like "$80,000 - $120,000", "£50k-£70k", "$100K", "80,000 - 120,000 per year"
  const patterns = [
    /[\$£€]\s?\d{2,3}[,.]?\d{0,3}\s?[kK]?\s?[-–to]+\s?[\$£€]?\s?\d{2,3}[,.]?\d{0,3}\s?[kK]?(?:\s?(?:per|\/)\s?(?:year|annum|yr|pa))?/,
    /[\$£€]\s?\d{2,3}[,.]?\d{0,3}\s?[kK]?(?:\s?(?:per|\/)\s?(?:year|annum|yr|pa))?/,
    /\d{2,3}[,.]?\d{0,3}\s?[-–to]+\s?\d{2,3}[,.]?\d{0,3}\s?(?:per|\/)\s?(?:year|annum|yr|pa)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return undefined;
}

function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  return $("body").text().trim();
}
