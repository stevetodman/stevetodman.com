[CmdletBinding()]
param(
    [string]$EngineRoot
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Unreal-Common.ps1")

$resolvedEngineRoot = Resolve-CardioEngineRoot -EngineRoot $EngineRoot
$projectFile = Get-CardioProjectFile
$generateBat = Join-Path $resolvedEngineRoot "Engine\Build\BatchFiles\GenerateProjectFiles.bat"

Invoke-CardioCommand -FilePath $generateBat -ArgumentList @(
    "-project=$projectFile",
    "-game",
    "-engine",
    "-progress"
) -Description "Generate Visual Studio project files"

Write-Host "Unreal project files generated." -ForegroundColor Green
