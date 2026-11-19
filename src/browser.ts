import { chromium, Browser, BrowserContext, Page } from "playwright";
import fs from "fs";
import path from "path";
import os from "os";

const SESSION_DIR = path.join(os.homedir(), ".linkedin-mcp-session");

let browser: Browser | null = null;
let context: BrowserContext | null = null;

export async function getBrowser(): Promise<{ context: BrowserContext; page: Page }> {
  if (!browser || !browser.isConnected()) {
    // A previous context belongs to the old (closed) browser, so drop it.
    context = null;
    browser = await chromium.launch({
      headless: false, // visible so user can log in manually
    });
  }

  if (!context) {
    context = await browser.newContext({
      storageState: loadSession(),
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });
  }

  const page = await context.newPage();
  return { context, page };
}

function loadSession(): string | undefined {
  const sessionFile = path.join(SESSION_DIR, "state.json");
  if (fs.existsSync(sessionFile)) {
    return sessionFile;
  }
  return undefined;
}

export async function saveSession(): Promise<void> {
  if (!context) return;
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
  await context.storageState({ path: path.join(SESSION_DIR, "state.json") });
}

export async function closeBrowser(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}
