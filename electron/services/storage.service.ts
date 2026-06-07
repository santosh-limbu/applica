// ============================================================
// Applica — Secure Storage Service (Electron safeStorage)
// ============================================================

import { safeStorage } from 'electron';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

function getKeyFilePath(): string {
  return path.join(app.getPath('userData'), 'api-key.enc');
}

/**
 * Encrypt and persist a Gemini API key using Electron's OS-level
 * credential store (DPAPI on Windows, Keychain on macOS, libsecret on Linux).
 */
export function saveApiKey(key: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn(
      '[StorageService] OS encryption not available — storing key in plaintext as fallback.'
    );
    fs.writeFileSync(getKeyFilePath(), key, 'utf-8');
    return;
  }
  const encrypted = safeStorage.encryptString(key);
  fs.writeFileSync(getKeyFilePath(), encrypted);
}

/**
 * Retrieve and decrypt the stored API key.
 * Returns null when no key has been saved yet.
 */
export function getApiKey(): string | null {
  const filePath = getKeyFilePath();
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath);

    if (!safeStorage.isEncryptionAvailable()) {
      // Fallback: stored in plaintext
      return raw.toString('utf-8');
    }

    return safeStorage.decryptString(raw);
  } catch (err) {
    console.error('[StorageService] Failed to decrypt API key:', err);
    return null;
  }
}

/**
 * Check whether an API key file exists on disk.
 */
export function hasApiKey(): boolean {
  return fs.existsSync(getKeyFilePath());
}

/**
 * Remove the stored API key from disk.
 */
export function deleteApiKey(): void {
  const filePath = getKeyFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
