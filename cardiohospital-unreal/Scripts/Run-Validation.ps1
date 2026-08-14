[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Unreal-Common.ps1")

$projectRoot = Get-CardioProjectRoot
$nodePath = Resolve-CardioNode -RequiredMajorVersion 24

Push-Location $projectRoot
try {
    Invoke-CardioCommand -FilePath $nodePath -Description "Export generated clinical data" -ArgumentList @(
        "--experimental-strip-types",
        "Tools/export-clinical-data.mjs"
    )
    Invoke-CardioCommand -FilePath $nodePath -Description "Validate the Unreal clinical-data contract" -ArgumentList @(
        "Tools/validate-clinical-data.mjs"
    )
    Invoke-CardioCommand -FilePath $nodePath -Description "Generate the case-authoring report" -ArgumentList @(
        "Tools/case-authoring-report.mjs"
    )
    Invoke-CardioCommand -FilePath $nodePath -Description "Run portable clinical tests" -ArgumentList @(
        "--test",
        "Tests/*.test.mjs"
    )
}
finally {
    Pop-Location
}

Write-Host "==> Run workstation/build-script fixtures" -ForegroundColor Cyan
& (Join-Path $projectRoot "Tests\Workstation-Scripts.Tests.ps1")

Write-Host "Portable clinical content validation passed." -ForegroundColor Green

