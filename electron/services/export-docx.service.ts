// ============================================================
// Applica — DOCX Export Service (docx npm package)
// ============================================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  BorderStyle,
  type IParagraphOptions,
  type IRunOptions
} from 'docx';
import fs from 'fs';
import type { CVExportData } from '../types';

// ── Template Styling ─────────────────────────────────────────

interface TemplateStyle {
  headingColor: string;
  nameSize: number;
  headingSize: number;
  bodySize: number;
  fontFamily: string;
  sectionSpacing: number;
  bulletChar: string;
  showBorders: boolean;
}

const TEMPLATES: Record<string, TemplateStyle> = {
  modern: {
    headingColor: '2563EB', // Blue
    nameSize: 56,
    headingSize: 28,
    bodySize: 22,
    fontFamily: 'Calibri',
    sectionSpacing: 200,
    bulletChar: '•',
    showBorders: true
  },
  classic: {
    headingColor: '000000',
    nameSize: 52,
    headingSize: 26,
    bodySize: 22,
    fontFamily: 'Times New Roman',
    sectionSpacing: 240,
    bulletChar: '•',
    showBorders: false
  },
  minimal: {
    headingColor: '374151', // Gray-700
    nameSize: 48,
    headingSize: 24,
    bodySize: 21,
    fontFamily: 'Arial',
    sectionSpacing: 160,
    bulletChar: '–',
    showBorders: false
  }
};

// ── Public API ───────────────────────────────────────────────

/**
 * Generate a DOCX file from structured CV data and save to outputPath.
 */
export async function exportDOCX(
  data: CVExportData,
  templateId: string,
  outputPath: string
): Promise<string> {
  const style = TEMPLATES[templateId] ?? TEMPLATES['modern'];
  const sections: Paragraph[] = [];

  // ── Name Header ──
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.profile.full_name,
          bold: true,
          size: style.nameSize,
          font: style.fontFamily,
          color: style.headingColor
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 }
    })
  );

  // ── Contact Info Line ──
  const contactParts: string[] = [];
  if (data.profile.email) contactParts.push(data.profile.email);
  if (data.profile.phone) contactParts.push(data.profile.phone);
  if (data.profile.location) contactParts.push(data.profile.location);
  if (data.profile.linkedin_url) contactParts.push(data.profile.linkedin_url);
  if (data.profile.portfolio_url) contactParts.push(data.profile.portfolio_url);

  if (contactParts.length > 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: style.bodySize - 2,
            font: style.fontFamily,
            color: '666666'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: style.sectionSpacing }
      })
    );
  }

  // ── Professional Summary ──
  if (data.professional_summary) {
    sections.push(createSectionHeading('Professional Summary', style));
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.professional_summary,
            size: style.bodySize,
            font: style.fontFamily
          })
        ],
        spacing: { after: style.sectionSpacing }
      })
    );
  }

  // ── Experience ──
  if (data.experiences.length > 0) {
    sections.push(createSectionHeading('Experience', style));

    for (const exp of data.experiences) {
      // Role & Company line
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.role,
              bold: true,
              size: style.bodySize + 2,
              font: style.fontFamily
            }),
            new TextRun({
              text: `  —  ${exp.company}`,
              size: style.bodySize + 2,
              font: style.fontFamily,
              color: '444444'
            })
          ],
          spacing: { before: 120, after: 40 }
        })
      );

      // Dates & Location
      const dateLine = formatDateRange(exp.start_date, exp.end_date);
      const locationStr = exp.location ? `  |  ${exp.location}` : '';
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: dateLine + locationStr,
              size: style.bodySize - 2,
              font: style.fontFamily,
              italics: true,
              color: '888888'
            })
          ],
          spacing: { after: 60 }
        })
      );

      // Description
      if (exp.description) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.description,
                size: style.bodySize,
                font: style.fontFamily
              })
            ],
            spacing: { after: 40 }
          })
        );
      }

      // Achievements as bullet points
      if (exp.achievements) {
        const bullets = exp.achievements
          .split('\n')
          .map((b) => b.replace(/^[-•*]\s*/, '').trim())
          .filter(Boolean);

        for (const bullet of bullets) {
          sections.push(createBulletPoint(bullet, style));
        }
      }

      // Spacer between experiences
      sections.push(
        new Paragraph({ children: [], spacing: { after: 80 } })
      );
    }
  }

  // ── Education ──
  if (data.education.length > 0) {
    sections.push(createSectionHeading('Education', style));

    for (const edu of data.education) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${edu.degree}${edu.field_of_study ? ' in ' + edu.field_of_study : ''}`,
              bold: true,
              size: style.bodySize + 2,
              font: style.fontFamily
            }),
            new TextRun({
              text: `  —  ${edu.institution}`,
              size: style.bodySize + 2,
              font: style.fontFamily,
              color: '444444'
            })
          ],
          spacing: { before: 100, after: 40 }
        })
      );

      const dateLine = formatDateRange(edu.start_date, edu.end_date);
      const gradePart = edu.grade ? `  |  ${edu.grade}` : '';
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: dateLine + gradePart,
              size: style.bodySize - 2,
              font: style.fontFamily,
              italics: true,
              color: '888888'
            })
          ],
          spacing: { after: 60 }
        })
      );

      if (edu.description) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.description,
                size: style.bodySize,
                font: style.fontFamily
              })
            ],
            spacing: { after: 80 }
          })
        );
      }
    }
  }

  // ── Skills ──
  if (data.skills.length > 0) {
    sections.push(createSectionHeading('Skills', style));

    // Group skills by category
    const grouped: Record<string, string[]> = {};
    for (const skill of data.skills) {
      const cat = skill.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(
        skill.proficiency ? `${skill.name} (${skill.proficiency})` : skill.name
      );
    }

    for (const [category, skillNames] of Object.entries(grouped)) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${category}: `,
              bold: true,
              size: style.bodySize,
              font: style.fontFamily
            }),
            new TextRun({
              text: skillNames.join(', '),
              size: style.bodySize,
              font: style.fontFamily
            })
          ],
          spacing: { after: 60 }
        })
      );
    }
  }

  // ── Certifications ──
  if (data.certifications.length > 0) {
    sections.push(createSectionHeading('Certifications', style));

    for (const cert of data.certifications) {
      const parts: IRunOptions[] = [
        {
          text: cert.name,
          bold: true,
          size: style.bodySize,
          font: style.fontFamily
        }
      ];

      if (cert.issuer) {
        parts.push({
          text: ` — ${cert.issuer}`,
          size: style.bodySize,
          font: style.fontFamily,
          color: '444444'
        });
      }

      if (cert.date_obtained) {
        parts.push({
          text: ` (${cert.date_obtained})`,
          size: style.bodySize - 2,
          font: style.fontFamily,
          italics: true,
          color: '888888'
        });
      }

      sections.push(
        new Paragraph({
          children: parts.map((p) => new TextRun(p)),
          spacing: { after: 60 }
        })
      );
    }
  }

  // ── Build Document ──
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch in TWIPs
              bottom: 720,
              left: 1080, // 0.75 inch
              right: 1080
            }
          }
        },
        children: sections
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

// ── Paragraph Factories ──────────────────────────────────────

function createSectionHeading(text: string, style: TemplateStyle): Paragraph {
  const opts: IParagraphOptions = {
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: style.headingSize,
        font: style.fontFamily,
        color: style.headingColor
      })
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: style.sectionSpacing, after: 80 },
    ...(style.showBorders
      ? {
          border: {
            bottom: {
              color: style.headingColor,
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        }
      : {})
  };

  return new Paragraph(opts);
}

function createBulletPoint(text: string, style: TemplateStyle): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${style.bulletChar} `,
        size: style.bodySize,
        font: style.fontFamily
      }),
      new TextRun({
        text,
        size: style.bodySize,
        font: style.fontFamily
      })
    ],
    indent: { left: 360 }, // 0.25 inch in TWIPs
    spacing: { after: 40 }
  });
}

// ── Utilities ────────────────────────────────────────────────

function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return '';
  const s = start || '';
  const e = end || 'Present';
  return `${s} – ${e}`;
}
