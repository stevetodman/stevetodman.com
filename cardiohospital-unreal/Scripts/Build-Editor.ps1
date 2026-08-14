[CmdletBinding()]
param(
    [string]$EngineRoot
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Unreal-Common.ps1")

$resolvedEngineRoot = Resolve-CardioEngineRoot -EngineRoot $EngineRoot
$projectFile = Get-CardioProjectFile
$buildBat = Join-Path $resolvedEngineRoot "Engine\Build\BatchFiles\Build.bat"

Invoke-CardioCommand -FilePath $buildBat -ArgumentList @(
    "CardioHospitalEditor",
    "Win64",
    "Development",
    $projectFile,
    "-WaitMutex",
    "-FromMsBuild"
) -Description "Build CardioHospitalEditor (Win64 Development)"

Write-Host "CardioHospitalEditor build completed." -ForegroundColor Green

