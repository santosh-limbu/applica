// ============================================================
// Applica — Database Service (better-sqlite3, synchronous API)
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import type {
  Profile,
  Experience,
  Education,
  Skill,
  Certification,
  Application,
  CV,
  CoverLetter,
  Reminder
} from '../types';

let db: Database.Database;

// ── Initialisation ───────────────────────────────────────────

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'applica.db');
  db = new Database(dbPath);

  // Performance & safety pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  createTables();
}

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      location TEXT,
      linkedin_url TEXT,
      portfolio_url TEXT,
      professional_summary TEXT,
      writing_samples TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      location TEXT,
      description TEXT,
      achievements TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      institution TEXT NOT NULL,
      degree TEXT NOT NULL,
      field_of_study TEXT,
      start_date TEXT,
      end_date TEXT,
      grade TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT,
      proficiency TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      issuer TEXT,
      date_obtained TEXT,
      expiry_date TEXT,
      credential_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id),
      company TEXT NOT NULL,
      role_title TEXT NOT NULL,
      job_description TEXT,
      job_url TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','applied','interview','rejected','offer','accepted','withdrawn')),
      applied_date DATETIME,
      salary_range TEXT,
      recruiter_name TEXT,
      recruiter_email TEXT,
      notes TEXT,
      ats_score REAL,
      ats_score_details TEXT,
      ai_analysis TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cvs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id),
      profile_id INTEGER NOT NULL REFERENCES profiles(id),
      title TEXT NOT NULL,
      template_id TEXT NOT NULL,
      content TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      is_latest INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cover_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id),
      profile_id INTEGER NOT NULL REFERENCES profiles(id),
      content TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      is_latest INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id),
      remind_at DATETIME NOT NULL,
      message TEXT,
      is_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Ensure 'references' column exists in profiles table
  try {
    db.exec('ALTER TABLE profiles ADD COLUMN "references" TEXT');
  } catch (err) {
    // Column already exists, ignore
  }

  // Ensure 'ats_score_details' column exists in applications table
  try {
    db.exec('ALTER TABLE applications ADD COLUMN "ats_score_details" TEXT');
  } catch (err) {
    // Column already exists, ignore
  }
}

export function getDb(): Database.Database {
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}

// ── Settings ─────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  if (!db) return null;
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row ? row.value : null;
}

export function setSetting(key: string, value: string): void {
  if (!db) return;
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function deleteSetting(key: string): void {
  if (!db) return;
  db.prepare('DELETE FROM settings WHERE key = ?').run(key);
}

// ── Profiles ─────────────────────────────────────────────────

export function getProfile(): Profile | null {
  const row = db.prepare('SELECT * FROM profiles ORDER BY id DESC LIMIT 1').get() as
    | Profile
    | undefined;
  return row ?? null;
}

export function getProfileById(id: number): Profile | null {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as Profile | undefined;
  return row ?? null;
}

export function saveProfile(profile: Profile): Profile {
  if (profile.id) {
    db.prepare(
      `UPDATE profiles SET
        full_name = ?, email = ?, phone = ?, location = ?,
        linkedin_url = ?, portfolio_url = ?, professional_summary = ?,
        writing_samples = ?, "references" = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).run(
      profile.full_name,
      profile.email ?? null,
      profile.phone ?? null,
      profile.location ?? null,
      profile.linkedin_url ?? null,
      profile.portfolio_url ?? null,
      profile.professional_summary ?? null,
      profile.writing_samples ?? null,
      profile.references ?? null,
      profile.id
    );
    return getProfileById(profile.id)!;
  } else {
    const result = db.prepare(
      `INSERT INTO profiles (full_name, email, phone, location, linkedin_url, portfolio_url, professional_summary, writing_samples, "references")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      profile.full_name,
      profile.email ?? null,
      profile.phone ?? null,
      profile.location ?? null,
      profile.linkedin_url ?? null,
      profile.portfolio_url ?? null,
      profile.professional_summary ?? null,
      profile.writing_samples ?? null,
      profile.references ?? null
    );
    return getProfileById(Number(result.lastInsertRowid))!;
  }
}

export function deleteProfile(id: number): void {
  db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
}

// ── Experiences ──────────────────────────────────────────────

export function getExperiences(profileId: number): Experience[] {
  return db
    .prepare('SELECT * FROM experiences WHERE profile_id = ? ORDER BY sort_order ASC, start_date DESC')
    .all(profileId) as Experience[];
}

export function getExperienceById(id: number): Experience | null {
  const row = db.prepare('SELECT * FROM experiences WHERE id = ?').get(id) as Experience | undefined;
  return row ?? null;
}

export function saveExperience(exp: Experience): Experience {
  if (exp.id) {
    db.prepare(
      `UPDATE experiences SET
        profile_id = ?, company = ?, role = ?, start_date = ?, end_date = ?,
        location = ?, description = ?, achievements = ?, sort_order = ?
      WHERE id = ?`
    ).run(
      exp.profile_id,
      exp.company,
      exp.role,
      exp.start_date,
      exp.end_date ?? null,
      exp.location ?? null,
      exp.description ?? null,
      exp.achievements ?? null,
      exp.sort_order ?? 0,
      exp.id
    );
    return getExperienceById(exp.id)!;
  } else {
    const result = db.prepare(
      `INSERT INTO experiences (profile_id, company, role, start_date, end_date, location, description, achievements, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      exp.profile_id,
      exp.company,
      exp.role,
      exp.start_date,
      exp.end_date ?? null,
      exp.location ?? null,
      exp.description ?? null,
      exp.achievements ?? null,
      exp.sort_order ?? 0
    );
    return getExperienceById(Number(result.lastInsertRowid))!;
  }
}

export function deleteExperience(id: number): void {
  db.prepare('DELETE FROM experiences WHERE id = ?').run(id);
}

// ── Education ────────────────────────────────────────────────

export function getEducation(profileId: number): Education[] {
  return db
    .prepare('SELECT * FROM education WHERE profile_id = ? ORDER BY sort_order ASC, end_date DESC')
    .all(profileId) as Education[];
}

export function getEducationById(id: number): Education | null {
  const row = db.prepare('SELECT * FROM education WHERE id = ?').get(id) as Education | undefined;
  return row ?? null;
}

export function saveEducation(edu: Education): Education {
  if (edu.id) {
    db.prepare(
      `UPDATE education SET
        profile_id = ?, institution = ?, degree = ?, field_of_study = ?,
        start_date = ?, end_date = ?, grade = ?, description = ?, sort_order = ?
      WHERE id = ?`
    ).run(
      edu.profile_id,
      edu.institution,
      edu.degree,
      edu.field_of_study ?? null,
      edu.start_date ?? null,
      edu.end_date ?? null,
      edu.grade ?? null,
      edu.description ?? null,
      edu.sort_order ?? 0,
      edu.id
    );
    return getEducationById(edu.id)!;
  } else {
    const result = db.prepare(
      `INSERT INTO education (profile_id, institution, degree, field_of_study, start_date, end_date, grade, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      edu.profile_id,
      edu.institution,
      edu.degree,
      edu.field_of_study ?? null,
      edu.start_date ?? null,
      edu.end_date ?? null,
      edu.grade ?? null,
      edu.description ?? null,
      edu.sort_order ?? 0
    );
    return getEducationById(Number(result.lastInsertRowid))!;
  }
}

export function deleteEducation(id: number): void {
  db.prepare('DELETE FROM education WHERE id = ?').run(id);
}

// ── Skills ───────────────────────────────────────────────────

export function getSkills(profileId: number): Skill[] {
  return db
    .prepare('SELECT * FROM skills WHERE profile_id = ? ORDER BY category ASC, name ASC')
    .all(profileId) as Skill[];
}

export function getSkillById(id: number): Skill | null {
  const row = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as Skill | undefined;
  return row ?? null;
}

export function saveSkill(skill: Skill): Skill {
  if (skill.id) {
    db.prepare(
      `UPDATE skills SET
        profile_id = ?, name = ?, category = ?, proficiency = ?
      WHERE id = ?`
    ).run(skill.profile_id, skill.name, skill.category ?? null, skill.proficiency ?? null, skill.id);
    return getSkillById(skill.id)!;
  } else {
    const result = db.prepare(
      `INSERT INTO skills (profile_id, name, category, proficiency) VALUES (?, ?, ?, ?)`
    ).run(skill.profile_id, skill.name, skill.category ?? null, skill.proficiency ?? null);
    return getSkillById(Number(result.lastInsertRowid))!;
  }
}

export function deleteSkill(id: number): void {
  db.prepare('DELETE FROM skills WHERE id = ?').run(id);
}

// ── Certifications ───────────────────────────────────────────

export function getCertifications(profileId: number): Certification[] {
  return db
    .prepare('SELECT * FROM certifications WHERE profile_id = ? ORDER BY date_obtained DESC')
    .all(profileId) as Certification[];
}

export function getCertificationById(id: number): Certification | null {
  const row = db.prepare('SELECT * FROM certifications WHERE id = ?').get(id) as
    | Certification
    | undefined;
  return row ?? null;
}

export function saveCertification(cert: Certification): Certification {
  if (cert.id) {
    db.prepare(
      `UPDATE certifications SET
        profile_id = ?, name = ?, issuer = ?, date_obtained = ?,
        expiry_date = ?, credential_url = ?
      WHERE id = ?`
    ).run(
      cert.profile_id,
      cert.name,
      cert.issuer ?? null,
      cert.date_obtained ?? null,
      cert.expiry_date ?? null,
      cert.credential_url ?? null,
      cert.id
    );
    return getCertificationById(cert.id)!;
  } else {
    const result = db.prepare(
      `INSERT INTO certifications (profile_id, name, issuer, date_obtained, expiry_date, credential_url)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      cert.profile_id,
      cert.name,
      cert.issuer ?? null,
      cert.date_obtained ?? null,
      cert.expiry_date ?? null,
      cert.credential_url ?? null
    );
    return getCertificationById(Number(result.lastInsertRowid))!;
  }
}

export function deleteCertification(id: number): void {
  db.prepare('DELETE FROM certifications WHERE id = ?').run(id);
}

// ── Applications ─────────────────────────────────────────────

export function getApplications(): Application[] {
  return db
    .prepare('SELECT * FROM applications ORDER BY updated_at DESC')
    .all() as Application[];
}

export function getApplicationById(id: number): Application | null {
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as
    | Application
    | undefined;
  return row ?? null;
}

export function saveApplication(application: Application): Application {
  if (application.id) {
    db.prepare(
      `UPDATE applications SET
        profile_id = ?, company = ?, role_title = ?, job_description = ?,
        job_url = ?, status = ?, applied_date = ?, salary_range = ?,
        recruiter_name = ?, recruiter_email = ?, notes = ?,
        ats_score = ?, ats_score_details = ?, ai_analysis = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).run(
      application.profile_id,
      application.company,
      application.role_title,
      application.job_description ?? null,
      application.job_url ?? null,
      application.status ?? 'draft',
      application.applied_date ?? null,
      application.salary_range ?? null,
      application.recruiter_name ?? null,
      application.recruiter_email ?? null,
      application.notes ?? null,
      application.ats_score ?? null,
      application.ats_score_details ?? null,
      application.ai_analysis ?? null,
      application.id
    );
    return getApplicationById(application.id)!;
  } else {
    const result = db.prepare(
      `INSERT INTO applications (profile_id, company, role_title, job_description, job_url, status, applied_date, salary_range, recruiter_name, recruiter_email, notes, ats_score, ats_score_details, ai_analysis)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      application.profile_id,
      application.company,
      application.role_title,
      application.job_description ?? null,
      application.job_url ?? null,
      application.status ?? 'draft',
      application.applied_date ?? null,
      application.salary_range ?? null,
      application.recruiter_name ?? null,
      application.recruiter_email ?? null,
      application.notes ?? null,
      application.ats_score ?? null,
      application.ats_score_details ?? null,
      application.ai_analysis ?? null
    );
    return getApplicationById(Number(result.lastInsertRowid))!;
  }
}

export function updateApplicationStatus(id: number, status: string): void {
  db.prepare(
    'UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(status, id);
}

export function deleteApplication(id: number): void {
  db.prepare('DELETE FROM applications WHERE id = ?').run(id);
}

// ── CVs ──────────────────────────────────────────────────────

export function getCvs(applicationId: number): CV[] {
  return db
    .prepare('SELECT * FROM cvs WHERE application_id = ? ORDER BY version DESC')
    .all(applicationId) as CV[];
}

export function getCvById(id: number): CV | null {
  const row = db.prepare('SELECT * FROM cvs WHERE id = ?').get(id) as CV | undefined;
  return row ?? null;
}

export function saveCv(cv: CV): CV {
  if (cv.id) {
    db.prepare(
      `UPDATE cvs SET
        application_id = ?, profile_id = ?, title = ?, template_id = ?,
        content = ?, version = ?, is_latest = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).run(
      cv.application_id ?? null,
      cv.profile_id,
      cv.title,
      cv.template_id,
      cv.content,
      cv.version ?? 1,
      cv.is_latest ?? 1,
      cv.id
    );
    return getCvById(cv.id)!;
  } else {
    // Mark previous versions as not latest
    if (cv.application_id) {
      db.prepare(
        'UPDATE cvs SET is_latest = 0 WHERE application_id = ? AND profile_id = ?'
      ).run(cv.application_id, cv.profile_id);
    }

    // Get next version number
    const latest = db
      .prepare(
        'SELECT MAX(version) as max_version FROM cvs WHERE application_id = ? AND profile_id = ?'
      )
      .get(cv.application_id ?? null, cv.profile_id) as { max_version: number | null } | undefined;
    const nextVersion = (latest?.max_version ?? 0) + 1;

    const result = db.prepare(
      `INSERT INTO cvs (application_id, profile_id, title, template_id, content, version, is_latest)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    ).run(
      cv.application_id ?? null,
      cv.profile_id,
      cv.title,
      cv.template_id,
      cv.content,
      nextVersion
    );
    return getCvById(Number(result.lastInsertRowid))!;
  }
}

export function deleteCv(id: number): void {
  db.prepare('DELETE FROM cvs WHERE id = ?').run(id);
}

// ── Cover Letters ────────────────────────────────────────────

export function getCoverLetters(applicationId: number): CoverLetter[] {
  return db
    .prepare('SELECT * FROM cover_letters WHERE application_id = ? ORDER BY version DESC')
    .all(applicationId) as CoverLetter[];
}

export function getCoverLetterById(id: number): CoverLetter | null {
  const row = db.prepare('SELECT * FROM cover_letters WHERE id = ?').get(id) as
    | CoverLetter
    | undefined;
  return row ?? null;
}

export function saveCoverLetter(cl: CoverLetter): CoverLetter {
  if (cl.id) {
    db.prepare(
      `UPDATE cover_letters SET
        application_id = ?, profile_id = ?, content = ?,
        version = ?, is_latest = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).run(
      cl.application_id ?? null,
      cl.profile_id,
      cl.content,
      cl.version ?? 1,
      cl.is_latest ?? 1,
      cl.id
    );
    return getCoverLetterById(cl.id)!;
  } else {
    if (cl.application_id) {
      db.prepare(
        'UPDATE cover_letters SET is_latest = 0 WHERE application_id = ? AND profile_id = ?'
      ).run(cl.application_id, cl.profile_id);
    }

    const latest = db
      .prepare(
        'SELECT MAX(version) as max_version FROM cover_letters WHERE application_id = ? AND profile_id = ?'
      )
      .get(cl.application_id ?? null, cl.profile_id) as { max_version: number | null } | undefined;
    const nextVersion = (latest?.max_version ?? 0) + 1;

    const result = db.prepare(
      `INSERT INTO cover_letters (application_id, profile_id, content, version, is_latest)
       VALUES (?, ?, ?, ?, 1)`
    ).run(cl.application_id ?? null, cl.profile_id, cl.content, nextVersion);
    return getCoverLetterById(Number(result.lastInsertRowid))!;
  }
}

export function deleteCoverLetter(id: number): void {
  db.prepare('DELETE FROM cover_letters WHERE id = ?').run(id);
}

// ── Reminders ────────────────────────────────────────────────

export function getReminders(applicationId: number): Reminder[] {
  return db
    .prepare('SELECT * FROM reminders WHERE application_id = ? ORDER BY remind_at ASC')
    .all(applicationId) as Reminder[];
}

export function getPendingReminders(): Reminder[] {
  return db
    .prepare(
      "SELECT * FROM reminders WHERE is_completed = 0 AND remind_at <= datetime('now') ORDER BY remind_at ASC"
    )
    .all() as Reminder[];
}

export function saveReminder(reminder: Reminder): Reminder {
  if (reminder.id) {
    db.prepare(
      `UPDATE reminders SET
        application_id = ?, remind_at = ?, message = ?, is_completed = ?
      WHERE id = ?`
    ).run(
      reminder.application_id,
      reminder.remind_at,
      reminder.message ?? null,
      reminder.is_completed ?? 0,
      reminder.id
    );
    return db.prepare('SELECT * FROM reminders WHERE id = ?').get(reminder.id) as Reminder;
  } else {
    const result = db.prepare(
      'INSERT INTO reminders (application_id, remind_at, message) VALUES (?, ?, ?)'
    ).run(reminder.application_id, reminder.remind_at, reminder.message ?? null);
    return db.prepare('SELECT * FROM reminders WHERE id = ?').get(
      Number(result.lastInsertRowid)
    ) as Reminder;
  }
}

export function completeReminder(id: number): void {
  db.prepare('UPDATE reminders SET is_completed = 1 WHERE id = ?').run(id);
}

export function deleteReminder(id: number): void {
  db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
}

// ── Utility ──────────────────────────────────────────────────

export function isFirstRun(): boolean {
  const profile = getProfile();
  return profile === null;
}
