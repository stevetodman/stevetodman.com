import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function openAcademy(viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  const response = await page.goto(server.origin + '/myocarditis/', { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  return { context, page, errors };
}

describe('myocarditis academy shell', () => {
  test('loads cleanly with eight keyboard-operable tabs', async () => {
    const { context, page, errors } = await openAcademy();
    assert.equal(await page.locator('[role="tab"]').count(), 8);
    assert.equal(await page.locator('[role="tabpanel"]:not([hidden])').getAttribute('data-panel'), 'start');

    await page.locator('#tab-start').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[role="tabpanel"]:not([hidden])').getAttribute('data-panel'), 'recognize');
    assert.equal(await page.locator('#tab-recognize').getAttribute('aria-selected'), 'true');
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('opening decision gives corrective feedback', async () => {
    const { context, page } = await openAcademy();
    await page.locator('[data-opening="0"]').click();
    await page.waitForSelector('#opening-feedback.feedback-box');
    assert.match(await page.locator('#opening-feedback').innerText(), /Unsafe/);
    assert.equal(await page.locator('[data-opening="1"]').evaluate(el => el.classList.contains('correct')), true);
    await context.close();
  });
});

describe('learning interactions', () => {
  test('pretest completes all six questions and saves baseline state', async () => {
    const { context, page } = await openAcademy();
    await page.locator('#pretest-start').click();
    for (let index = 0; index < 6; index += 1) {
      await page.locator('[data-pre-answer]').first().click();
    }
    assert.match(await page.locator('#pretest-stage').innerText(), /Baseline complete/i);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('myocarditis-academy-v1')));
    assert.equal(saved.pretestComplete, true);
    assert.equal(typeof saved.pretestScore, 'number');
    await context.close();
  });

  test('unsafe case choice cannot advance until corrected', async () => {
    const { context, page } = await openAcademy();
    await page.locator('#tab-cases').click();
    assert.match(await page.locator('#case-stage').innerText(), /Decision 1 of 3/i);

    await page.locator('[data-case-answer="0"]').click();
    assert.match(await page.locator('#case-feedback').innerText(), /Not safe yet/);
    assert.match(await page.locator('#case-stage').innerText(), /Decision 1 of 3/i);

    await page.locator('[data-case-answer="1"]').click();
    await page.locator('[data-case-continue]').click();
    assert.match(await page.locator('#case-stage').innerText(), /Decision 2 of 3/i);
    await context.close();
  });
});

describe('mastery assessment', () => {
  test('renders 15 questions, scores 80% to pass, and supports a perfect attempt', async () => {
    const { context, page } = await openAcademy();
    await page.locator('#tab-assessment').click();
    await page.locator('#posttest-start').click();
    assert.equal(await page.locator('#posttest-form fieldset').count(), 15);

    const answerText = new Map([
      ['Which finding most strongly shifts an infant with respiratory symptoms toward acute cardiac failure?', 'Hepatomegaly with cool perfusion'],
      ['A teen has syncope and new complete AV block after a febrile illness. What is the safest interpretation?', 'Myocarditis must be considered and urgent monitored evaluation is required'],
      ['Which statement about a viral prodrome is correct?', 'It raises suspicion but is neither necessary nor sufficient'],
      ['Which updated Lake Louise combination is correct?', 'At least one T2-based edema marker plus at least one T1-based injury marker'],
      ['When is EMB most useful?', 'When identifying a treatable histologic subtype or mimic could change management'],
      ['Which is the best interpretation of a normal initial troponin?', 'Probability may fall, but a high-suspicion phenotype still requires evaluation'],
      ['A hypotensive child with suspected myocarditis has hepatomegaly and pulmonary edema. Best fluid statement?', 'Avoid reflexive large bolus; define congestion/preload and reassess any small aliquot'],
      ['Which trajectory should trigger MCS-center activation?', 'Rising lactate, end-organ injury, escalating vasoactives, and biventricular failure'],
      ['A child develops pulseless VT. What comes first?', 'Defibrillation and high-quality CPR'],
      ['Which statement about IVIG is most defensible?', 'Widely used, but universal benefit is uncertain and practice is center-specific'],
      ['When are corticosteroids most clearly rational?', 'Defined immune-mediated/systemic disease or biopsy-directed inflammatory subtype'],
      ['Which antithrombotic statement is correct?', 'Therapeutic anticoagulation is indicated for documented thrombus and protocolized during MCS; prophylaxis is individualized'],
      ['Which athlete may be considered for return as early as 4–6 weeks under 2025 guidance?', 'Selected preserved-function patient with clinical/inflammatory resolution and no relevant arrhythmia'],
      ['After IVIG 2 g/kg, which vaccine statement is correct?', 'MMR/varicella/MMRV are generally delayed 11 months; LAIV is exempt from antibody interference timing'],
      ['Which discharge statement is safest?', 'Follow-up should integrate function, rhythm, biomarkers, symptoms, and CMR as phenotype-appropriate']
    ]);

    const fieldsets = page.locator('#posttest-form fieldset');
    for (let index = 0; index < 15; index += 1) {
      const fieldset = fieldsets.nth(index);
      const legend = await fieldset.locator('legend').innerText();
      const question = [...answerText.keys()].find(key => legend.includes(key));
      assert.ok(question, `unmapped question: ${legend}`);
      const wanted = answerText.get(question);
      const labels = fieldset.locator('label');
      let clicked = false;
      for (let option = 0; option < await labels.count(); option += 1) {
        const label = labels.nth(option);
        if ((await label.innerText()).includes(wanted)) {
          await label.click();
          clicked = true;
          break;
        }
      }
      assert.equal(clicked, true, `answer not found for: ${question}`);
    }

    await page.locator('#posttest-form button[type="submit"]').click();
    assert.match(await page.locator('#posttest-results').innerText(), /15\/15/);
    assert.match(await page.locator('#posttest-results').innerText(), /Mastery achieved/i);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('myocarditis-academy-v1')));
    assert.equal(saved.posttestPassed, true);
    assert.equal(saved.posttestBest, 15);
    await context.close();
  });
});

describe('clinical-content safeguards', () => {
  const html = fs.readFileSync(path.join(repoRoot, 'myocarditis/index.html'), 'utf8');

  test('contains corrected high-consequence guidance', () => {
    assert.match(html, /at least one T2-based criterion plus at least one T1-based criterion/i);
    assert.match(html, /allows consideration of return as early as 4–6 weeks/i);
    assert.match(html, /LAIV is specifically exempt/i);
    assert.match(html, /No evidence-based universal rule says every child with LVEF below a fixed threshold should receive aspirin/i);
    assert.match(html, /No single inotrope is universally “preferred.”/i);
  });

  test('does not preserve superseded or overclaimed source assertions', () => {
    assert.doesNotMatch(html, /Diagnosis is LIKELY if positive in ≥2 of 3 criteria/i);
    assert.doesNotMatch(html, /minimum 6 months after onset of disease/i);
    assert.doesNotMatch(html, /live-attenuated intranasal influenza[^<]*11 months/i);
    assert.doesNotMatch(html, /Aspirin continued until LVEF &gt;40%/i);
    assert.doesNotMatch(html, /Milrinone[^<]{0,40}preferred first-line/i);
  });

  test('links directly to primary sources and identifies the adult overlay', () => {
    for (const doi of [
      '10.1161/CIR.0000000000001001',
      '10.1016/j.jacc.2018.09.072',
      '10.1016/j.jacc.2024.10.080',
      '10.1161/CIR.0000000000001297',
      '10.1161/CIR.0000000000001428'
    ]) assert.match(html, new RegExp(doi.replaceAll('.', '\\.')));
    assert.match(html, /Adult document used only as a contemporary overlay/);
  });
});
