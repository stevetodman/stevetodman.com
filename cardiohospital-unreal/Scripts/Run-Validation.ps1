[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) {
    $nodeCommand.Source
}
else {
    $candidate = Join-Path ([Environment]::GetFolderPath("UserProfile")) ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
    if (Test-Path -LiteralPath $candidate) { $candidate } else { $null }
}

if (-not $nodePath) {
    throw "Node.js 24 was not found on PATH or in the Codex bundled runtime."
}

Push-Location $projectRoot
try {
    & $nodePath --experimental-strip-types Tools/export-clinical-data.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & $nodePath Tools/validate-clinical-data.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & $nodePath --test Tests/*.test.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}

Write-Host "Portable clinical content validation passed." -ForegroundColor Green

