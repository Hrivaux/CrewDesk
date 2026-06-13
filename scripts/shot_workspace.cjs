const { chromium: pw } = require("playwright-core");

async function main() {
  const chromium = (await import("@sparticuz/chromium")).default;
  const browser = await pw.launch({
    args: [...chromium.args, "--force-color-profile=srgb"],
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERR:", m.text()); });
    await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const place = async (label, x, y) => {
      await page.getByRole("button", { name: label, exact: true }).first().click();
      await page.waitForTimeout(300);
      await page.mouse.click(x, y);
      await page.waitForTimeout(500);
    };

    // place a few objects spread across the board
    await place("Work Desk", 560, 470);
    await place("Whiteboard", 880, 380);
    await place("Safe / Vault", 720, 560);
    await place("Kanban Board", 600, 600);
    await place("Server Rack", 900, 540);
    await place("Plant", 500, 560);

    // add a couple agents
    await page.getByRole("button", { name: "Add agent", exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Add agent", exact: true }).click();
    await page.waitForTimeout(800);

    await page.screenshot({ path: "/tmp/shots/workspace.png" });
    console.log("shot saved");
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
