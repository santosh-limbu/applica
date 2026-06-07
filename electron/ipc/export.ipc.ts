// ============================================================
// Applica — Export IPC Handlers (PDF & DOCX)
// ============================================================

import { ipcMain, dialog, BrowserWindow } from 'electron';
import { exportPDF } from '../services/export-pdf.service';
import { exportDOCX } from '../services/export-docx.service';
import * as db from '../services/database.service';
import type { CVExportData } from '../types';

export function registerExportHandlers(): void {
  // ── PDF Export ───────────────────────────────────────────────

  ipcMain.handle('exportPDF', async (_event, html: string, fileName: string) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      const result = await dialog.showSaveDialog(win!, {
        title: 'Save CV as PDF',
        defaultPath: fileName,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
      });

      if (result.canceled || !result.filePath) {
        return null;
      }

      return await exportPDF(html, result.filePath);
    } catch (err) {
      console.error('[IPC:exportPDF]', err);
      throw new Error(`PDF export failed: ${(err as Error).message}`);
    }
  });

  // ── DOCX Export ──────────────────────────────────────────────

  ipcMain.handle(
    'exportDOCX',
    async (_event, cvData: CVExportData, templateId: string, fileName: string) => {
      try {
        const win = BrowserWindow.getFocusedWindow();
        const result = await dialog.showSaveDialog(win!, {
          title: 'Save CV as Word Document',
          defaultPath: fileName,
          filters: [
            { name: 'Word Document', extensions: ['docx'] },
          ]
        });

        if (result.canceled || !result.filePath) {
          return null;
        }

        return await exportDOCX(cvData, templateId, result.filePath);
      } catch (err) {
        console.error('[IPC:exportDOCX]', err);
        throw new Error(`DOCX export failed: ${(err as Error).message}`);
      }
    }
  );

  // ── Generic Save Dialog ──────────────────────────────────────

  ipcMain.handle(
    'showSaveDialog',
    async (_event, defaultName: string, filters: Electron.FileFilter[]) => {
      try {
        const win = BrowserWindow.getFocusedWindow();
        const result = await dialog.showSaveDialog(win!, {
          title: 'Save File',
          defaultPath: defaultName,
          filters
        });
        return result.canceled ? null : result.filePath;
      } catch (err) {
        console.error('[IPC:showSaveDialog]', err);
        return null;
      }
    }
  );
}
