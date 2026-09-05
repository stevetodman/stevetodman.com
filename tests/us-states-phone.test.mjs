import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, getChromium } from "./helpers/harness.mjs";

let server;
let browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

test("50 States current test run works at 390px without changing the child flow", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(server.origin + "/study/us-states.html");

  const luke = page.locator('.profile-pick[data-name="Luke"]');
  if (await luke.isVisible().catch(() => false)) await luke.click();
  const avatarSkip = page.locator("#toMenu");
  if (await avatarSkip.isVisible().catch(() => false)) await avatarSkip.click();

  const testCard = page.locator('.menu-card[data-mode="test"]');
  await testCard.waitFor({ state: "visible" });
  assert.match(await testCard.innerText(), /Test Run/);
  assert.match(await testCard.innerText(), /(?:40|50) questions/);
  await testCard.click();

  assert.match(await page.locator("h1").innerText(), /School Test Run/);
  assert.match(await page.locator(".score-line").innerText(), /Question 1 of (?:40|50)/);
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert.equal(fits, true, "the phone page should not overflow horizontally");
  await context.close();
});
