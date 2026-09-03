import { chromium, webkit } from 'playwright';

const url = process.env.HOSPITAL_URL || 'https://stevetodman.com/hospital/';
const engines = [
  ['chromium', chromium],
  ['webkit', webkit],
];

let failed = false;

for (const [name, engine] of engines) {
  console.log(`\n=== ${name} ===`);
  const browser = await engine.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const events = [];

  page.on('pageerror', (error) => events.push(`PAGEERROR ${error.stack || error.message}`));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      events.push(`CONSOLE ${message.type().toUpperCase()} ${message.text()}`);
    }
  });
  page.on('requestfailed', (request) => {
    events.push(`REQUEST_FAILED ${request.resourceType()} ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      events.push(`HTTP_${response.status()} ${response.request().resourceType()} ${response.url()}`);
    }
  });

  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  console.log(`NAV ${response?.status()} ${page.url()}`);
  await page.waitForTimeout(12_000);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log(`BODY ${bodyText.replace(/\s+/g, ' ').slice(0, 1000)}`);

  const runtime = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    let webgl = null;
    if (canvas instanceof HTMLCanvasElement) {
      try {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        webgl = gl ? { ok: true, version: gl.getParameter(gl.VERSION) } : { ok: false };
      } catch (error) {
        webgl = { ok: false, error: String(error) };
      }
    }
    return {
      userAgent: navigator.userAgent,
      hasCanvas: !!canvas,
      webgl,
      serviceWorkerController: !!navigator.serviceWorker?.controller,
    };
  }).catch((error) => ({ evaluateError: String(error) }));
  console.log(`RUNTIME ${JSON.stringify(runtime)}`);

  for (const event of events) console.log(event);

  const fatal = /The clinical world could not load\./.test(bodyText);
  const entry = /Pediatric Hospital/.test(bodyText) && /Enter the hospital|Resume patient|Loading saved shift/.test(bodyText);
  console.log(`RESULT fatal=${fatal} entry=${entry} eventCount=${events.length}`);
  if (fatal || !entry) failed = true;

  await page.screenshot({ path: `/tmp/hospital-${name}.png`, fullPage: true }).catch(() => {});
  await browser.close();
}

if (failed) process.exitCode = 1;
