// ============================================================
// Applica — Main Process Entry Point
// ============================================================

import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import * as dns from 'dns';
import { initDatabase, closeDatabase } from './services/database.service';
import { registerAllHandlers } from './ipc/index';

// Prioritise IPv4 resolution for localhost to prevent ECONNREFUSED with local AI services (Ollama/LM Studio) on Windows
dns.setDefaultResultOrder('ipv4first');

let mainWindow: BrowserWindow | null = null;

// ── Single Instance Lock ─────────────────────────────────────
// Prevent multiple instances of the app from running simultaneously.

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ── Window Creation ──────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Applica',
    show: false, // Show after ready-to-show to avoid visual flash
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',     // Slate-900
      symbolColor: '#e2e8f0', // Slate-200
      height: 36
    },
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Show window once it's ready (avoids white flash)
  mainWindow.on('ready-to-show', () => {
    mainWindow!.show();
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App Lifecycle ────────────────────────────────────────────

app.whenReady().then(() => {
  // Initialise database before anything else
  initDatabase();

  // Register all IPC handlers
  registerAllHandlers();

  // Create the main window
  createWindow();

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up on quit
app.on('before-quit', () => {
  closeDatabase();
});
