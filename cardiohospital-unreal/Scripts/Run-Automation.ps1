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
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $ReportRoot = Join-Path $projectRoot "Saved\AutomationReports\$stamp"
}
$ReportRoot = [System.IO.Path]::GetFullPath($ReportRoot)
New-Item -ItemType Directory -Path $ReportRoot -Force | Out-Null
$logPath = Join-Path $ReportRoot "CardioHospital-Automation.log"

Invoke-CardioCommand -FilePath $editorCmd -ArgumentList @(
    $projectFile,
    "-unattended",
    "-nop4",
    "-nopause",
    "-nosplash",
    "-NullRHI",
    "-NoSound",
    "-ExecCmds=Automation RunTests CardioHospital",
    "-TestExit=Automation Test Queue Empty",
    "-ReportExportPath=$ReportRoot",
    "-log=$logPath"
)

Write-Host "Cardio Hospital automation passed. Report: $ReportRoot" -ForegroundColor Green
