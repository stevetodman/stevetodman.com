import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = async (name) => readFile(resolve(projectRoot, "Scripts", name), "utf8");
const projectFile = async (name) => readFile(resolve(projectRoot, name), "utf8");

test("workstation preflight is standard-user safe and IT actionable", async () => {
  const source = await script("Check-Workstation.ps1");

  assert.match(source, /RequiresElevationToRun\s*=\s*\$false/);
  assert.match(source, /ITOrAdminRequired/);
  assert.match(source, /UserAction/);
  assert.match(source, /\[string\]\$ReportPath/);
  assert.match(source, /Microsoft\.VisualStudio\.Workload\.NativeGame/);
  assert.match(source, /10\.0\.22621\.0/);
  assert.match(source, /48GB/);
  assert.doesNotMatch(source, /Start-Process|Verb\s+RunAs|winget\s+install/i);
});

test("Unreal discovery validates a complete 5.8 installation", async () => {
  const source = await script("Unreal-Common.ps1");

  assert.match(source, /LauncherInstalled\.dat/);
  assert.match(source, /UE_5_8_ROOT/);
  assert.match(source, /Build\.version/);
  assert.match(source, /UnrealEditor-Cmd\.exe/);
  assert.match(source, /Visual Studio 2026 Fixture|\[17\.0,19\.0\)/);
  assert.match(source, /RTX\\s\*\(4080\|4090\|5080\|5090\)/);
});

test("automation uses UE 5.8 command syntax and verifies the report", async () => {
  const source = await script("Run-Automation.ps1");

  assert.match(source, /Automation RunTest CardioHospital/);
  assert.doesNotMatch(source, /Automation RunTests CardioHospital/);
  assert.match(source, /index\.json/);
  assert.match(source, /succeededWithWarnings/);
  assert.match(source, /Initialize-CardioOutputDirectory/);
});

test("packaging rejects stale output and unverifiable source", async () => {
  const source = await script("Package-Windows.ps1");

  assert.match(source, /Initialize-CardioOutputDirectory/);
  assert.match(source, /Get-CardioGitProvenance/g);
  assert.doesNotMatch(source, /sourceCommit\s*=\s*"unknown"/);
  assert.match(source, /walkthroughPassed\s*=\s*\$false/);
  assert.match(source, /status\s*=\s*"not-run"/);
  assert.match(source, /evidence\s*=\s*\$null/);
});

test("Monday preflight runs readiness before portable validation", async () => {
  const source = await script("Run-Monday-Preflight.ps1");
  const workstationIndex = source.indexOf("Check-Workstation.ps1");
  const validationIndex = source.indexOf("Run-Validation.ps1");

  assert.ok(workstationIndex >= 0);
  assert.ok(validationIndex > workstationIndex);
  assert.doesNotMatch(source, /Start-Process|Verb\s+RunAs|winget\s+install/i);
});

test("walkthrough evidence cannot bypass package, acceptance, or performance gates", async () => {
  const source = await script("Record-WalkthroughEvidence.ps1");

  assert.match(source, /ConfirmExactPackageRun/);
  assert.match(source, /PassedAcceptanceStep/);
  assert.match(source, /passedSteps\.Count -eq 19/);
  assert.match(source, /FrameTimeP95Ms/);
  assert.match(source, /EvidenceArtifactPath/);
  assert.match(source, /Get-FileHash/);
  assert.match(source, /unexpectedPaths/);
  assert.match(source, /walkthroughPassed = \(\$Outcome -eq "Passed"\)/);
  assert.doesNotMatch(source, /Start-Process|Verb\s+RunAs|winget\s+install/i);
});

test("portable validation executes PowerShell fixtures on Windows", async () => {
  const source = await script("Run-Validation.ps1");
  assert.match(source, /Workstation-Scripts\.Tests\.ps1/);
});

test("CI preserves cross-platform portable and generated-content gates", async () => {
  const workflow = await readFile(
    resolve(projectRoot, "..", ".github", "workflows", "cardiohospital-unreal.yml"),
    "utf8",
  );

  // The release platform must be in the matrix, and the other two stay so the
  // portable core keeps proving it is genuinely platform independent.
  assert.match(workflow, /macos-latest/);
  assert.match(workflow, /ubuntu-latest/);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /run-validation\.sh/);
  assert.match(workflow, /Parse Windows PowerShell wrappers/);
  assert.match(workflow, /Run-Validation\.ps1/);
  assert.match(workflow, /git diff --exit-code -- cardiohospital-unreal\/Content\/Data\/clinical-content\.json/);
});

test("requirement coverage keeps unproven Unreal gates pending", async () => {
  const coverage = await projectFile("REQUIREMENT_COVERAGE.md");
  const checklist = await projectFile("WALKTHROUGH_CHECKLIST.md");

  assert.match(coverage, /168-section product specification/);
  assert.match(coverage, /actual walkthrough pending/i);
  assert.match(coverage, /cannot yet prove Unreal Header/);
  assert.match(checklist, /Nineteen acceptance steps/);
  assert.match(checklist, /Any failed, blocked, skipped, or unimplemented step/);
});
