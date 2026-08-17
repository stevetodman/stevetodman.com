[CmdletBinding()]
param(
    [string]$EngineRoot,

    [ValidateRange(20, 1000)]
    [int]$MinimumFreeDiskGB = 100,

    [switch]$SkipDiskCheck,

    [string]$ReportPath
)

$ErrorActionPreference = "Stop"

if (-not $ReportPath) {
    $stamp = [DateTime]::UtcNow.ToString("yyyyMMdd-HHmmssfff")
    $ReportPath = "Saved\WorkstationReports\monday-preflight-$stamp.json"
}

$checkArguments = @{
    MinimumFreeDiskGB = $MinimumFreeDiskGB
    ReportPath = $ReportPath
}
if ($EngineRoot) { $checkArguments.EngineRoot = $EngineRoot }
if ($SkipDiskCheck) { $checkArguments.SkipDiskCheck = $true }

Write-Host "==> Read-only workstation readiness check (no elevation or installation)" -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "Check-Workstation.ps1") @checkArguments

Write-Host "==> Portable clinical validation" -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "Run-Validation.ps1")

Write-Host "Monday preflight passed without requiring elevation." -ForegroundColor Green
Write-Host "Next: generate project files, build the editor, run Unreal automation, then package Windows." -ForegroundColor Cyan
