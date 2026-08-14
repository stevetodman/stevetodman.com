[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $projectRoot
try {
    node --experimental-strip-types Tools/export-clinical-data.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node Tools/validate-clinical-data.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node --test Tests/*.test.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}

Write-Host "Portable clinical content validation passed." -ForegroundColor Green

