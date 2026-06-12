// ============================================================
// Applicai — LinkedIn Profile Browser Scraper Service
// ============================================================

import { BrowserWindow } from 'electron';

let scraperWindow: BrowserWindow | null = null;

/**
 * Open a headed browser window for LinkedIn profile scraping.
 */
export async function openLinkedInScraper(url: string): Promise<void> {
  if (scraperWindow && !scraperWindow.isDestroyed()) {
    scraperWindow.focus();
    return;
  }

  scraperWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    show: true,
    title: 'LinkedIn Import - Applicai',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Default to LinkedIn if no URL provided
  const targetUrl = url && url.trim().startsWith('http')
    ? url.trim()
    : 'https://www.linkedin.com/login';

  await scraperWindow.loadURL(targetUrl);

  // Focus the window when loaded
  scraperWindow.on('ready-to-show', () => {
    if (scraperWindow) scraperWindow.show();
  });

  scraperWindow.on('closed', () => {
    scraperWindow = null;
  });
}

/**
 * Extract the innerText from the active scraper window and close it.
 */
export async function completeLinkedInScrape(): Promise<string> {
  if (!scraperWindow || scraperWindow.isDestroyed()) {
    throw new Error('Scraper window is not open. Please click "Open LinkedIn Browser" first.');
  }

  try {
    // Implement a 5-second timeout for executing Javascript to prevent hanging
    const textPromise = scraperWindow.webContents.executeJavaScript('document.body.innerText');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Text extraction timed out')), 5000)
    );

    const text = await Promise.race([textPromise, timeoutPromise]);
    
    scraperWindow.close();
    scraperWindow = null;
    return text as string;
  } catch (err) {
    try {
      if (scraperWindow && !scraperWindow.isDestroyed()) {
        scraperWindow.close();
      }
    } catch {
      // Ignore window close errors during failure cleanup
    }
    scraperWindow = null;
    throw new Error(`Failed to extract text from browser page: ${(err as Error).message}`);
  }
}
