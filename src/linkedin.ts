import { Page } from "playwright";
import { getBrowser, saveSession } from "./browser.js";

export async function linkedinLogin(): Promise<string> {
  const { page } = await getBrowser();
  await page.goto("https://www.linkedin.com/login");

  // Wait for user to manually log in (up to 3 minutes)
  await page.waitForURL("**/feed**", { timeout: 180000 });
  await saveSession();
  await page.close();
  return "Logged in successfully. Session saved.";
}

export async function linkedinGetProfile(): Promise<string> {
  const { page } = await getBrowser();
  try {
    await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const name = await page.locator("h1").first().textContent().catch(() => "N/A");
    const headline = await page
      .locator(".text-body-medium.break-words")
      .first()
      .textContent()
      .catch(() => "N/A");

    const skillLocators = page.locator(".pvs-list__item--line-separated .visually-hidden");
    const count = await skillLocators.count();
    const skills: string[] = [];
    for (let i = 0; i < Math.min(count, 20); i++) {
      const text = await skillLocators.nth(i).textContent();
      if (text?.trim()) skills.push(text.trim());
    }

    return JSON.stringify(
      { name: name?.trim(), headline: headline?.trim(), skills },
      null,
      2
    );
  } finally {
    await page.close();
  }
}

export async function linkedinUpdateSummary(summary: string): Promise<string> {
  const { page } = await getBrowser();
  try {
    await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const aboutEditBtn = page
      .locator('section[data-section="summary"] .artdeco-button--tertiary')
      .first();
    await aboutEditBtn.click();
    await page.waitForTimeout(1000);

    const textarea = page.locator('textarea[name="summary"]');
    await textarea.click();
    await textarea.fill(summary);

    await page.locator('button[aria-label="Save"]').click();
    await page.waitForTimeout(2000);

    return "Summary updated successfully.";
  } finally {
    await page.close();
  }
}

export async function linkedinAddSkill(skill: string): Promise<string> {
  const { page } = await getBrowser();
  try {
    await page.goto("https://www.linkedin.com/in/me/details/skills/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);

    await page.locator('a[href*="skills/new"]').first().click();
    await page.waitForTimeout(1500);

    const input = page.locator('input[id*="skill"]').first();
    await input.fill(skill);
    await page.waitForTimeout(1000);

    const suggestion = page.locator(".basic-typeahead__selectable").first();
    if (await suggestion.isVisible()) {
      await suggestion.click();
    }

    await page.locator('button[aria-label="Save"]').click();
    await page.waitForTimeout(2000);

    return `Skill "${skill}" added successfully.`;
  } finally {
    await page.close();
  }
}

export async function linkedinAddCertification(cert: {
  name: string;
  issuer: string;
  issueDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}): Promise<string> {
  const { page } = await getBrowser();
  try {
    await page.goto("https://www.linkedin.com/in/me/details/certifications/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);

    await page.locator('a[href*="certifications/new"]').first().click();
    await page.waitForTimeout(1500);

    await fillField(page, 'input[id*="certificationName"]', cert.name);
    await fillField(page, 'input[id*="issuer"]', cert.issuer);

    if (cert.issueDate) {
      const [month, year] = cert.issueDate.split("/");
      await page.selectOption('select[id*="issueMonth"]', month).catch(() => {});
      await page.selectOption('select[id*="issueYear"]', year).catch(() => {});
    }

    if (cert.credentialId) {
      await fillField(page, 'input[id*="licenseNumber"]', cert.credentialId);
    }

    if (cert.credentialUrl) {
      await fillField(page, 'input[id*="certificationUrl"]', cert.credentialUrl);
    }

    await page.locator('button[aria-label="Save"]').click();
    await page.waitForTimeout(2000);

    return `Certification "${cert.name}" added successfully.`;
  } finally {
    await page.close();
  }
}

export async function linkedinUpdateHeadline(headline: string): Promise<string> {
  const { page } = await getBrowser();
  try {
    await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    await page.locator('button[aria-label="Edit intro"]').click();
    await page.waitForTimeout(1500);

    const headlineInput = page.locator('input[id*="headline"]');
    await headlineInput.click();
    await headlineInput.fill(headline);

    await page.locator('button[aria-label="Save"]').click();
    await page.waitForTimeout(2000);

    return "Headline updated successfully.";
  } finally {
    await page.close();
  }
}

export async function linkedinCreateTextPost(text: string): Promise<string> {
  const { page } = await getBrowser();
  try {
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Open the post composer
    await page.locator(".share-box-feed-entry__trigger").first().click();
    await page.waitForTimeout(1500);

    // Type into the Quill rich-text editor (fill() doesn't work on contenteditable)
    const editor = page.locator(".ql-editor").first();
    await editor.click();
    await page.keyboard.type(text);
    await page.waitForTimeout(500);

    // Post
    await page.locator('button.share-actions__primary-action').click();
    await page.waitForTimeout(3000);

    return "Text post published successfully.";
  } finally {
    await page.close();
  }
}

export async function linkedinCreateImagePost(text: string, imagePath: string): Promise<string> {
  const { page } = await getBrowser();
  try {
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Open the post composer
    await page.locator(".share-box-feed-entry__trigger").first().click();
    await page.waitForTimeout(1500);

    // Click the media/image button in the toolbar
    const mediaBtn = page.locator('button[aria-label*="media"], button[aria-label*="image"], button[aria-label*="photo"]').first();
    await mediaBtn.click();
    await page.waitForTimeout(1000);

    // Upload the image via hidden file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imagePath);
    await page.waitForTimeout(3000);

    // Click Next/Done if present after image preview loads
    const nextBtn = page.locator('button[aria-label="Next"], button:has-text("Next"), button:has-text("Done")').first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }

    // Type caption into the editor
    const editor = page.locator(".ql-editor").first();
    await editor.click();
    await page.keyboard.type(text);
    await page.waitForTimeout(500);

    // Post
    await page.locator('button.share-actions__primary-action').click();
    await page.waitForTimeout(3000);

    return "Image post published successfully.";
  } finally {
    await page.close();
  }
}

async function fillField(page: Page, selector: string, value: string): Promise<void> {
  const field = page.locator(selector).first();
  if (await field.isVisible()) {
    await field.fill(value);
    await page.waitForTimeout(500);
  }
}
