import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, constants, readFile, readdir } from "node:fs/promises";
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
