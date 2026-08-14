[CmdletBinding()]
param(
    [string]$EngineRoot,
    [string]$ReportRoot
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Unreal-Common.ps1")

$resolvedEngineRoot = Resolve-CardioEngineRoot -EngineRoot $EngineRoot
$projectRoot = Get-CardioProjectRoot
$projectFile = Get-CardioProjectFile
$editorCmd = Join-Path $resolvedEngineRoot "Engine\Binaries\Win64\UnrealEditor-Cmd.exe"

if (-not $ReportRoot) {
    $stamp = [DateTime]::UtcNow.ToString("yyyyMMdd-HHmmssfff")
    $ReportRoot = Join-Path $projectRoot "Saved\AutomationReports\$stamp"
}
$ReportRoot = Initialize-CardioOutputDirectory -Path $ReportRoot -Purpose "Automation report"
$logPath = Join-Path $ReportRoot "CardioHospital-Automation.log"

Invoke-CardioCommand -FilePath $editorCmd -ArgumentList @(
    $projectFile,
    "-unattended",
    "-nop4",
    "-nopause",
    "-nosplash",
    "-NullRHI",
    "-NoSound",
    "-stdout",
    "-FullStdOutLogOutput",
    "-UTF8Output",
    "-ExecCmds=Automation RunTest CardioHospital",
    "-TestExit=Automation Test Queue Empty",
    "-ReportExportPath=$ReportRoot",
    "-abslog=$logPath"
) -Description "Run CardioHospital Unreal automation tests"

$reportIndexPath = Join-Path $ReportRoot "index.json"
if (-not (Test-Path -LiteralPath $reportIndexPath -PathType Leaf)) {
    throw "Unreal exited without creating the expected automation report: $reportIndexPath"
}

try {
    $report = Get-Content -Raw -LiteralPath $reportIndexPath | ConvertFrom-Json
}
catch {
    throw "The Unreal automation report is not valid JSON: $reportIndexPath. $($_.Exception.Message)"
}

$requiredCounters = @("succeeded", "succeededWithWarnings", "failed", "notRun", "inProcess")
$missingCounters = @($requiredCounters | Where-Object { $report.PSObject.Properties.Name -notcontains $_ })
if ($missingCounters.Count -gt 0) {
    throw "The Unreal automation report is missing required counters: $($missingCounters -join ', '). Report: $reportIndexPath"
}

$completedCount = [int]$report.succeeded + [int]$report.succeededWithWarnings + [int]$report.failed
if ($completedCount -lt 1) {
    throw "No CardioHospital automation test completed. Confirm the test filter and WITH_DEV_AUTOMATION_TESTS build. Report: $reportIndexPath"
}
if ([int]$report.failed -gt 0 -or [int]$report.notRun -gt 0 -or [int]$report.inProcess -gt 0) {
    throw "Unreal automation did not pass cleanly (failed=$($report.failed), notRun=$($report.notRun), inProcess=$($report.inProcess)). Report: $reportIndexPath"
}
if ([int]$report.succeededWithWarnings -gt 0) {
    Write-Warning "$($report.succeededWithWarnings) Unreal automation test(s) passed with warnings. Review $reportIndexPath."
}

Write-Host "Cardio Hospital automation passed. Report: $ReportRoot" -ForegroundColor Green
