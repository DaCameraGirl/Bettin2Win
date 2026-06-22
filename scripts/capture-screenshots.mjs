/**
 * Capture portfolio screenshots for docs/screenshots/.
 * Usage: node scripts/capture-screenshots.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "docs", "screenshots");
const baseUrl = (process.argv[2] ?? "https://dacameragirl.github.io/Bettin2Win/").replace(
  /\/?$/,
  "/",
);

async function waitForApp(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForSelector(".topbar", { timeout: 30_000 });
  await page.waitForTimeout(2_000);
}

async function clickTab(page, label) {
  await page.locator(".tab", { hasText: label }).click();
  await page.waitForTimeout(500);
}

async function enableDemo(page) {
  const toggle = page.locator(".demo-toggle");
  const text = await toggle.textContent();
  if (text?.includes("View demo")) {
    await toggle.click();
    await page.waitForSelector(".demo-banner", { timeout: 5_000 });
  }
}

async function capture(page, name, selector, options = {}) {
  const target = page.locator(selector).first();
  await target.waitFor({ state: "visible", timeout: 15_000 });
  await target.screenshot({
    path: path.join(outDir, name),
    ...options,
  });
  console.log(`saved ${name}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await waitForApp(page);

    // Provider status panel (live health from engine)
    await capture(page, "provider-status.png", ".status-panel");

    // Dashboard with priced demo cards
    await enableDemo(page);
    await clickTab(page, "Basketball");
    await page.waitForSelector(".event", { timeout: 10_000 });
    await capture(page, "dashboard.png", "main.layout");

    // Beginner guide expanded
    const guide = page.locator("details.guide");
    await guide.evaluate((el) => {
      el.open = true;
    });
    await page.waitForTimeout(300);
    await capture(page, "beginner-guide.png", "details.guide");

    // Market movement sidebar (live feed; legend + panel chrome)
    await page.locator(".demo-toggle", { hasText: "Exit demo" }).click();
    await page.waitForSelector(".demo-banner", { state: "hidden", timeout: 5_000 }).catch(() => {});
    await clickTab(page, "Basketball");
    await page.waitForTimeout(4_000);
    await capture(page, "market-movement.png", "aside.feed");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});