import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = async (name) => readFile(resolve(projectRoot, "Scripts", name), "utf8");

test("first-build wrapper keeps the required order and optional package gate", async () => {
  const source = await script("Run-FirstBuild.ps1");
  const stages = [
    'Name = "preflight"',
    'Name = "validation"',
    'Name = "project-generation"',
    'Name = "editor-build"',
    'Name = "automation"',
    'Name = "package"',
  ];
  let previous = -1;
  for (const stage of stages) {
    const current = source.indexOf(stage);
    assert.ok(current > previous, `${stage} must follow the preceding stage`);
    previous = current;
  }

  assert.match(source, /\[switch\]\$IncludePackage/);
  assert.match(source, /Enabled = \[bool\]\$IncludePackage/);
  assert.match(source, /Package-Windows\.ps1/);
  assert.doesNotMatch(source, /Get-CardioGitProvenance\s*=|sourceCommit\s*=|walkthroughPassed\s*=\s*\$true/);
});

test("first-build wrapper is standard-user only and exposes safe resume controls", async () => {
  const source = await script("Run-FirstBuild.ps1");

  assert.match(source, /\[string\]\$ResumeReportPath/);
  assert.match(source, /\[string\]\$ReportPath/);
  assert.match(source, /\[switch\]\$RerunAll/);
  assert.match(source, /MinimumFreeDiskGB = 100/);
  assert.doesNotMatch(source, /Start-Process|Verb\s+RunAs|#requires\s+-RunAsAdministrator|winget\s+install|choco\s+install/i);
});

test("orchestrator reports reuse, blocking, package, and walkthrough truth separately", async () => {
  const source = await script("FirstBuild-Orchestration.ps1");

  assert.match(source, /powershell\.exe -NoProfile -ExecutionPolicy Bypass -File/);
  assert.match(source, /status = "reused"/);
  assert.match(source, /status = "blocked"/);
  assert.match(source, /"not-requested"/);
  assert.match(source, /"baseline-passed-package-not-requested"/);
  assert.match(source, /"package-created-walkthrough-not-run"/);
  assert.match(source, /status = "not-evaluated"/);
  assert.match(source, /passed = \$false/);
  assert.match(source, /standardUserSafe = \$true/);
  assert.match(source, /requiresElevationToRun = \$false/);
  assert.match(source, /installsSoftware = \$false/);
});

test("resume requires matching source and artifact hashes and preflight is never reused", async () => {
  const source = await script("FirstBuild-Orchestration.ps1");

  assert.match(source, /sourceFingerprintAfterStage/);
  assert.match(source, /environmentFingerprint/);
  assert.match(source, /Get-CardioFirstBuildEnvironmentFingerprint/);
  assert.match(source, /Test-CardioFirstBuildPackageConfiguration/);
  assert.match(source, /configurationMatches/);
  assert.match(source, /packageReuseAllowed/);
  assert.match(source, /Test-CardioFirstBuildArtifacts/);
  assert.match(source, /Get-FileHash/);
  assert.match(source, /if \(\$index -gt 0 -and \$allowReuse\)/);
  assert.match(source, /if \(\$index -gt 0\) \{ \$allowReuse = \$false \}/);
  assert.match(source, /already exists; choose a new filename/);
  assert.match(source, /Project source changed while/);
});
