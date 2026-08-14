[CmdletBinding()]
param(
    [string]$EngineRoot,

    [ValidateSet("Development", "Shipping")]
    [string]$Configuration = "Development",

    [string]$ArchiveDirectory
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Unreal-Common.ps1")

$resolvedEngineRoot = Resolve-CardioEngineRoot -EngineRoot $EngineRoot
$projectRoot = Get-CardioProjectRoot
$projectFile = Get-CardioProjectFile
$uatBat = Join-Path $resolvedEngineRoot "Engine\Build\BatchFiles\RunUAT.bat"

if (-not $ArchiveDirectory) {
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $ArchiveDirectory = Join-Path $projectRoot "PackagedBuilds\Win64-$Configuration-$stamp"
}
$ArchiveDirectory = [System.IO.Path]::GetFullPath($ArchiveDirectory)
New-Item -ItemType Directory -Path $ArchiveDirectory -Force | Out-Null

Invoke-CardioCommand -FilePath $uatBat -ArgumentList @(
    "BuildCookRun",
    "-project=$projectFile",
    "-noP4",
    "-platform=Win64",
    "-clientconfig=$Configuration",
    "-build",
    "-cook",
    "-stage",
    "-package",
    "-pak",
    "-compressed",
    "-prereqs",
    "-archive",
    "-archivedirectory=$ArchiveDirectory",
    "-utf8output"
)

$repoRoot = Split-Path -Parent $projectRoot
$sourceCommit = (& git -C $repoRoot rev-parse HEAD 2>$null)
if ($LASTEXITCODE -ne 0) { $sourceCommit = "unknown" }

$files = Get-ChildItem -LiteralPath $ArchiveDirectory -Recurse -File |
    Where-Object { $_.Name -ne "build-manifest.json" } |
    Sort-Object FullName |
    ForEach-Object {
        [ordered]@{
            path = (Get-CardioRelativePath -BasePath $ArchiveDirectory -Path $_.FullName).Replace("\", "/")
            bytes = $_.Length
            sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        }
    }

$manifest = [ordered]@{
    schemaVersion = 1
    generatedAtUtc = [DateTime]::UtcNow.ToString("o")
    sourceCommit = $sourceCommit
    target = "CardioHospital"
    platform = "Win64"
    configuration = $Configuration
    walkthroughPassed = $false
    files = @($files)
}
$manifestPath = Join-Path $ArchiveDirectory "build-manifest.json"
$manifestJson = $manifest | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($manifestPath, "$manifestJson`n", [System.Text.UTF8Encoding]::new($false))

Write-Host "Windows package completed: $ArchiveDirectory" -ForegroundColor Green
Write-Host "The manifest intentionally records walkthroughPassed=false until the packaged build is run." -ForegroundColor Yellow
