[CmdletBinding()]
param(
    [string]$EngineRoot = "C:\Program Files\Epic Games\UE_5.8"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$projectFile = Join-Path $projectRoot "CardioHospital.uproject"
$buildBat = Join-Path $EngineRoot "Engine\Build\BatchFiles\Build.bat"

if (-not (Test-Path $buildBat)) {
    throw "Unreal build script not found at $buildBat. Pass -EngineRoot with the UE 5.8 install directory."
}

& $buildBat CardioHospitalEditor Win64 Development $projectFile -WaitMutex -FromMsBuild
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "CardioHospitalEditor build completed." -ForegroundColor Green

