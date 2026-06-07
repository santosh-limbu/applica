// ============================================================
// Applica — PDF Export Service (hidden BrowserWindow → printToPDF)
// ============================================================

import { BrowserWindow } from 'electron';

/**
 * Render an HTML string to an A4 PDF file.
 *
 * Creates a hidden, off-screen BrowserWindow, loads the HTML, waits for
 * rendering to complete, then uses webContents.printToPDF to produce the file.
 */
export async function exportPDF(html: string, outputPath: string): Promise<string> {
  let win: BrowserWindow | null = null;

  try {
    win = new BrowserWindow({
      width: 794, // A4 at 96 DPI
      height: 1123,
      show: false,
      webPreferences: {
        offscreen: true,
        javascript: false,
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Load HTML as a data URI so we don't need a temp file
    await win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(wrapHtmlForPrint(html))}`
    );

    // Wait for the page to be fully rendered
    await new Promise<void>((resolve) => {
      win!.webContents.on('did-finish-load', () => resolve());
    });

    // Small delay to allow CSS to settle (fonts, images)
    await delay(300);

    const pdfBuffer = await win.webContents.printToPDF({
      marginsType: 0,
      printBackground: true,
      printSelectionOnly: false,
      landscape: false,
      pageSize: 'A4',
      margins: {
        top: 0.4,
        bottom: 0.4,
        left: 0.4,
        right: 0.4
      }
    });

    const fs = await import('fs');
    fs.writeFileSync(outputPath, pdfBuffer);

    return outputPath;
  } finally {
    if (win && !win.isDestroyed()) {
      win.close();
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────

function wrapHtmlForPrint(html: string): string {
  // If the HTML already has <html> or <head>, return as-is
  if (html.toLowerCase().includes('<html')) {
    return html;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      margin: 0;
      padding: 15mm;
    }
    h1 { font-size: 22pt; margin-bottom: 4pt; }
    h2 { font-size: 14pt; margin-top: 14pt; margin-bottom: 6pt; border-bottom: 1px solid #ccc; padding-bottom: 2pt; }
    h3 { font-size: 12pt; margin-top: 10pt; margin-bottom: 4pt; }
    ul { margin: 4pt 0; padding-left: 18pt; }
    li { margin-bottom: 3pt; }
    p { margin: 4pt 0; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
