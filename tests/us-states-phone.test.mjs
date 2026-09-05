import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { startServer, getChromium, repoRoot } from "./helpers/harness.mjs";

let server;
let browser;

before(async () => {
  execFileSync(process.execPath, ["scripts/build-site.mjs"], { cwd: repoRoot, stdio: "ignore" });
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

test("50 States authentic blank-map test works at 390px without answer feedback", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(server.origin + "/dist/study/us-states.html");

  const luke = page.locator('.profile-pick[data-name="Luke"]');
  if (await luke.isVisible().catch(() => false)) await luke.click();
  const avatarSkip = page.locator("#toMenu");
  if (await avatarSkip.isVisible().catch(() => false)) await avatarSkip.click();

  const testCard = page.locator('.menu-card[data-mode="test"]');
  await testCard.waitFor({ state: "visible" });
  assert.match(await testCard.innerText(), /Test Run/);
  assert.match(await testCard.innerText(), /Blank 50-state map/i);
  await testCard.click();

  assert.match(await page.locator("h1").innerText(), /School Test Run/);
  assert.match(await page.locator("#schoolTestCount").innerText(), /0 of 50 filled/);
  assert.equal(await page.locator("#schoolTestMap path.state").count(), 50);

  await page.locator('#schoolTestMap path.state[data-code="AL"]').click({ force: true });
  const input = page.locator("#schoolTestInput");
  await input.fill("Alabama");
  assert.match(await page.locator("#schoolTestCount").innerText(), /1 of 50 filled/);
  assert.equal(await page.locator('#schoolTestMap path.state[data-code="AL"]').evaluate(el => el.classList.contains("school-filled")), true);
  assert.doesNotMatch(await page.locator("body").innerText(), /Correct!|Wrong!|It's spelled:/i);

  const state = await page.evaluate(() => window.__schoolTestState());
  assert.equal(state.answered, 1);
  assert.equal(state.total, 50);
  assert.equal(state.required, 40);
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert.equal(fits, true, "the phone page should not overflow horizontally");
  await context.close();
});
