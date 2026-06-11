/**
 * Captures d'écran headless via le Chromium packagé npm (@sparticuz/chromium).
 * Le binaire est en --single-process : un navigateur neuf par capture.
 * Usage : `npm start &` puis `node scripts/screenshot.cjs`.
 */
const { chromium: pw } = require("playwright-core");

const SEED = JSON.stringify({ state: { onboardingDone: true }, version: 0 });

async function shot(chromium, name, viewport, path, waitMs, opts = {}) {
  const browser = await pw.launch({
    args: [...chromium.args, "--force-color-profile=srgb"],
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  try {
    const ctx = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
      isMobile: opts.isMobile ?? false,
      reducedMotion: "no-preference",
    });
    if (opts.skipOnboarding ?? true) {
      await ctx.addInitScript((s) => {
        try {
          localStorage.setItem("crewdesk-v1", s);
        } catch {}
      }, SEED);
    }
    const page = await ctx.newPage();
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(waitMs);
    await page.screenshot({ path: `/tmp/shots/${name}.png` });
    console.log(`✓ ${name}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const chromium = (await import("@sparticuz/chromium")).default;
  await shot(chromium, "crewdesk-scene-desktop", { width: 1440, height: 900 }, "/", 14000);
  await shot(chromium, "crewdesk-board-desktop", { width: 1440, height: 900 }, "/board", 9000);
  await shot(chromium, "crewdesk-scene-mobile", { width: 390, height: 844 }, "/", 12000, {
    isMobile: true,
  });
  await shot(chromium, "crewdesk-onboarding", { width: 1440, height: 900 }, "/", 2600, {
    skipOnboarding: false,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
