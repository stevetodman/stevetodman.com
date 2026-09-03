import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { getChromium, startServer, watchForErrors } from "./helpers/harness.mjs";

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

async function showGuided(page, question, label) {
  await page.evaluate(({ question, label }) => {
    window.MathMissionCurrentQuestion = question;
    document.querySelector("#skill-tag").textContent = `${label} · Guided`;
    document.querySelector("#question-body").innerHTML = question.prompt || "Guided model test";
    window.dispatchEvent(new CustomEvent("mathmission:question-generated", { detail: { micro: question.micro } }));
  }, { question, label });
  await page.locator("#lesson-model:not([hidden])").waitFor();
}

test("later-skill guided models are interactive, evidence-neutral, and hidden during independent work", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  const response = await page.goto(`${server.origin}/math/`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);

  try {
    const before = await page.evaluate(() => localStorage.getItem("mathmission.m1.v1"));
    assert.equal(await page.locator("#lesson-model").isHidden(), true);

    await showGuided(page, {
      micro: "decimal_round",
      assisted: false,
      prompt: "Round 18.376 to the nearest hundredth.",
      audit: { kind: "round", thousandths: 18376, digits: 2 }
    }, "Round decimals");
    assert.equal(await page.locator("#lesson-model").getAttribute("data-model-type"), "rounding");
    assert.match(await page.locator("#lesson-model").innerText(), /Rounding number line/);
    await page.locator('[data-model-action="midpoint"]').click();
    assert.match(await page.locator(".lesson-model-status").innerText(), /18\.375/);
    await page.locator('[data-model-action="upper"]').click();
    assert.match(await page.locator(".lesson-model-status").innerText(), /nearer benchmark/i);

    await page.evaluate(() => {
      document.querySelector("#skill-tag").textContent = "Round decimals";
    });
    await page.waitForTimeout(0);
    assert.equal(await page.locator("#lesson-model").isHidden(), true, "independent work must not show the guided model");

    await showGuided(page, {
      micro: "decimal_add",
      assisted: false,
      prompt: "Find 6.48 + 13.7.",
      audit: { kind: "add", aScaled: 648, bScaled: 1370, places: 2 }
    }, "Add decimals");
    assert.equal(await page.locator("#lesson-model").getAttribute("data-model-type"), "aligned");
    assert.match(await page.locator("#lesson-model").innerText(), /Align like place values/);
    await page.locator('[data-model-action="zeros"]').click();
    assert.ok(await page.locator(".align-cell.placeholder").count() >= 2, "placeholder-zero action should expose alignment zeros");
    await page.locator('.align-cell[data-column="3"]').first().click();
    assert.match(await page.locator(".lesson-model-status").innerText(), /hundredths column/i);

    await showGuided(page, {
      micro: "decimal_multiply",
      assisted: false,
      prompt: "Find 0.42 × 6.",
      audit: { kind: "product", aScaled: 42, aPlaces: 2, bScaled: 6, bPlaces: 0 }
    }, "Multiply decimals");
    assert.equal(await page.locator("#lesson-model").getAttribute("data-model-type"), "area");
    const firstArea = page.locator(".area-cell").first();
    await firstArea.click();
    assert.equal(await firstArea.locator("small").isHidden(), false);
    assert.match(await page.locator(".lesson-model-status").innerText(), /0\.4 × 6 = 2\.4/);

    await showGuided(page, {
      micro: "decimal_divide",
      assisted: false,
      prompt: "Find 7.56 ÷ 6.",
      audit: { kind: "quotient", dividendScaled: 756, dividendPlaces: 2, divisor: 6 }
    }, "Divide decimals");
    assert.equal(await page.locator("#lesson-model").getAttribute("data-model-type"), "sharing");
    await page.locator('[data-model-action="rename"]').click();
    assert.equal(await page.locator('[data-model-action="share"]').isDisabled(), false);
    assert.match(await page.locator(".lesson-model-status").innerText(), /756 hundredths/i);
    await page.locator('[data-model-action="share"]').click();
    assert.equal(await page.locator(".sharing-result").isHidden(), false);
    assert.match(await page.locator(".lesson-model-status").innerText(), /126 hundredths/i);

    const after = await page.evaluate(() => localStorage.getItem("mathmission.m1.v1"));
    assert.equal(after, before, "manipulative interactions must not create or change learner evidence");
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join("\n")}`);
  } finally {
    await context.close();
  }
});
