import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, constants, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scriptsDir = resolve(projectRoot, "Scripts");
const script = async (name) => readFile(resolve(scriptsDir, name), "utf8");

const SHELL_SCRIPTS = [
  "common.sh",
  "check-workstation.sh",
  "run-validation.sh",
  "generate-project-files.sh",
  "build-editor.sh",
  "run-automation.sh",
  "package-macos.sh",
  "run-first-build.sh",
  "record-walkthrough-evidence.sh",
];

test("every macOS release script is present, executable, and syntactically valid", async () => {
  const present = await readdir(scriptsDir);
  for (const name of SHELL_SCRIPTS) {
    assert.ok(present.includes(name), `missing release script ${name}`);
    await access(resolve(scriptsDir, name), constants.X_OK);
    await run("bash", ["-n", resolve(scriptsDir, name)]);
  }
});

test("scripts never install software, elevate, or weaken system policy", async () => {
  for (const name of SHELL_SCRIPTS) {
    const source = await script(name);
    assert.doesNotMatch(source, /\bsudo\b/, `${name} must run as the normal user`);
    assert.doesNotMatch(source, /brew\s+install|softwareupdate\s+--install/, `${name} must not install software`);
    assert.doesNotMatch(source, /spctl\s+--master-disable/, `${name} must not disable Gatekeeper`);
    assert.doesNotMatch(source, /xattr\s+-d\s+com\.apple\.quarantine/, `${name} must not clear quarantine`);
  }
});

test("preflight reports actionable categories and claims no performance result", async () => {
  const source = await script("check-workstation.sh");

  assert.match(source, /userAction/);
  assert.match(source, /itOrAdminRequired/);
  assert.match(source, /"requiresElevationToRun": false/);
  assert.match(source, /Apple silicon/);
  assert.match(source, /MIN_MEMORY_GB=48/);
  assert.match(source, /MIN_FREE_DISK_GB=100/);
  assert.match(source, /A passing preflight is not a performance pass/);
  assert.match(source, /do not bypass a prerequisite/);
});

test("preflight detects the Metal toolchain by executing it, not by resolving a path", async () => {
  const source = await script("check-workstation.sh");

  // A cook fails on every shader without this component, and the failure only
  // appears minutes in, after the editor build and automation have both passed.
  assert.match(source, /xcrun metal --version/);
  assert.match(source, /downloadComponent MetalToolchain/);
  assert.match(source, /"metalToolchain": \{ "passed"/);

  // `xcrun -f metal` resolves to a path and exits 0 even when the component is
  // absent, so it cannot be used as the detector. The script says so in a
  // comment, so assert against the executable lines rather than the whole file.
  const code = source
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");
  assert.doesNotMatch(code, /xcrun -f metal/);
});

test("engine discovery honours UE_5_8_ROOT and targets Apple silicon", async () => {
  const source = await script("common.sh");

  assert.match(source, /UE_5_8_ROOT/);
  assert.match(source, /CARDIO_REQUIRED_ENGINE_VERSION="5\.8"/);
  assert.match(source, /CARDIO_REQUIRED_NODE_MAJOR=24/);
  assert.match(source, /Mac\/Build\.sh/);
  assert.match(source, /arm64/);
});

test("automation uses UE 5.8 syntax and verifies the exported report", async () => {
  const source = await script("run-automation.sh");

  assert.match(source, /Automation RunTest /);
  assert.doesNotMatch(source, /Automation RunTests /);
  assert.match(source, /index\.json/);
  assert.match(source, /No tests ran; this is not a pass/);

  // The report is pretty-printed, so a compact grep pattern silently matches
  // nothing and waves real failures through. Parse it instead.
  assert.doesNotMatch(source, /grep -q '"Fail"'/);
  assert.match(source, /JSON\.parse/);
  assert.match(source, /tests\.length === 0/);
  assert.match(source, /state !== "Success"/);
  assert.match(source, /zero tests/);
});

test("automation verdict rejects empty and failing reports", async () => {
  // Exercise the embedded verdict logic against real report shapes rather than
  // trusting the source text. Shapes copied from a genuine UE 5.8 export.
  const source = await script("run-automation.sh");
  const program = source.slice(source.indexOf('const { readFileSync }'), source.indexOf("' \"$report_index\""));

  // Unreal writes the report with a UTF-8 BOM and tab indentation. Reproduce
  // both, because a fixture that omits them hides real parse failures.
  const verdict = async (report, { bom = true } = {}) => {
    const file = resolve(tmpdir(), `cardio-automation-${randomUUID()}.json`);
    await writeFile(file, `${bom ? "﻿" : ""}${JSON.stringify(report, null, "\t")}`, "utf8");
    try {
      await run(process.execPath, ["-e", program, file]);
      return "pass";
    } catch {
      return "fail";
    } finally {
      await rm(file, { force: true });
    }
  };

  const passing = (path) => ({ fullTestPath: path, state: "Success", errors: 0 });

  const shape = { tests: [passing("CardioHospital.Clinical.ContentLoads")] };
  assert.equal(await verdict(shape), "pass", "a BOM-prefixed report must still parse");
  assert.equal(await verdict(shape, { bom: false }), "pass", "a report without a BOM must also parse");
  assert.equal(await verdict({ tests: [] }), "fail", "an empty report must not pass");
  assert.equal(await verdict({}), "fail", "a report with no tests key must not pass");
  assert.equal(
    await verdict({ tests: [{ fullTestPath: "CardioHospital.Clinical.ContentLoads", state: "Fail", errors: 1 }] }),
    "fail",
    "a failing test must not pass",
  );
  assert.equal(
    await verdict({ tests: [passing("A"), { fullTestPath: "B", state: "NotRun", errors: 0 }] }),
    "fail",
    "a skipped test must not pass",
  );
});

test("packaging refuses unverifiable source and starts the manifest at failure", async () => {
  const [pkg, common] = await Promise.all([script("package-macos.sh"), script("common.sh")]);

  assert.match(common, /status --porcelain=v1 --untracked-files=all/);
  assert.match(common, /Commit or intentionally remove them before creating a verifiable package/);
  assert.match(pkg, /cardio_require_clean_worktree/);
  assert.match(pkg, /"walkthroughPassed": false/);
  assert.match(pkg, /sha256/);
  assert.match(pkg, /codesign --force --deep --sign -/);
});

test("packaging archives the staged bundle and refuses one with no cooked content", async () => {
  const pkg = await script("package-macos.sh");

  // UAT's -archive copies from Binaries/Mac, which holds the linked executable
  // and no cooked content. The staged bundle is the deliverable.
  assert.match(pkg, /Saved\/StagedBuilds\/Mac/);
  assert.doesNotMatch(pkg, /-archivedirectory=/, "UAT must not choose what gets archived");

  // Signing and hashing a bundle without paks produced a manifest that looked
  // like a real package and was not one. The count must gate the manifest.
  assert.match(pkg, /'\*\.pak'/);
  assert.match(pkg, /'\*\.utoc'/);
  assert.match(pkg, /'\*\.ucas'/);
  assert.match(pkg, /cooked_count > 0/);
  assert.match(pkg, /this is not a package/);

  // The gate has to precede the manifest, or it documents a failure the
  // manifest has already recorded as a success.
  assert.ok(
    pkg.indexOf("cooked_count > 0") < pkg.indexOf("build-manifest.json"),
    "the cooked-content gate must run before the manifest is written",
  );
});

test("walkthrough evidence cannot be granted without a complete, measured run", async () => {
  const source = await script("record-walkthrough-evidence.sh");

  assert.match(source, /step_count == 19/);
  assert.match(source, /report_age_seconds <= 86400/);
  assert.match(source, /no longer the exact package/);
  assert.match(source, /An incomplete run is a failed run/);
  assert.match(source, /< 60/, "average FPS gate must be enforced");
  assert.match(source, /> 16\.7/, "p95 frame time gate must be enforced");
  assert.match(source, /2560 \|\| RESOLUTION_HEIGHT != 1440/);
});

test("the first-build plan is resumable and claims no walkthrough result", async () => {
  const source = await script("run-first-build.sh");

  assert.match(source, /STAGES=\(preflight validation project-generation editor-build automation\)/);
  assert.match(source, /resumeCommand/);
  assert.match(source, /packageResumeCommand/);
  assert.match(source, /--start-at/);
  assert.match(source, /--rerun-all/);
  assert.match(source, /are separate gates and are not implied by any stage above/);
});

test("the shell path mirrors the retained PowerShell stage model", async () => {
  const shell = await script("run-first-build.sh");
  const powershell = await script("Run-FirstBuild.ps1");

  // Both paths must use the same stage vocabulary so a resumeCommand reads the
  // same way regardless of which workflow produced the report.
  for (const stage of ["preflight", "validation", "project-generation", "editor-build", "automation", "package"]) {
    assert.match(shell, new RegExp(stage, "i"), `shell plan is missing the ${stage} stage`);
    assert.match(powershell, new RegExp(stage, "i"), `PowerShell plan is missing the ${stage} stage`);
  }
});
