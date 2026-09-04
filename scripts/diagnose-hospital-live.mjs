import { chromium, webkit } from 'playwright';
import { classifyHospitalBody } from './hospital-live-body-check.mjs';

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
  const csp = response?.headers()['content-security-policy'] || '';
  const allowsWasm = /(?:^|[\s;,])'wasm-unsafe-eval'(?=[\s;,]|$)/.test(csp);
  const allowsGeneralEval = /(?:^|[\s;,])'unsafe-eval'(?=[\s;,]|$)/.test(csp);
  console.log(`NAV ${response?.status()} ${page.url()}`);
  console.log(`CSP wasm-unsafe-eval=${allowsWasm} unsafe-eval=${allowsGeneralEval} ${csp}`);
  await page.waitForTimeout(12_000);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  const { visibleText, fatal, entry } = classifyHospitalBody(bodyText);
  console.log(`BODY ${visibleText.slice(0, 1000)}`);

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

  const wasmCspError = events.some((event) => /WebAssembly|wasm-unsafe-eval|unsafe-eval/.test(event));
  console.log(
    `RESULT fatal=${fatal} entry=${entry} allowsWasm=${allowsWasm} allowsGeneralEval=${allowsGeneralEval} wasmCspError=${wasmCspError} eventCount=${events.length}`,
  );
  if (fatal || !entry || !allowsWasm || allowsGeneralEval || wasmCspError) failed = true;

  await page.screenshot({ path: `/tmp/hospital-${name}.png`, fullPage: true }).catch(() => {});
  await browser.close();
}

if (failed) process.exitCode = 1;
