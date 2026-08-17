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
$engineInspection = Get-CardioEngineInspection -Path $resolvedEngineRoot
$visualStudio = Get-CardioVisualStudioInfo
$windowsSdk = Get-CardioWindowsSdkInfo -MinimumVersion ([version]"10.0.22621.0")

if (
    -not $visualStudio.Found -or
    -not $visualStudio.MeetsMinimumVersion -or
    -not $visualStudio.HasGameCppWorkload -or
    -not $visualStudio.HasMsvcX64 -or
    -not $visualStudio.MeetsMinimumMsvc
) {
    throw "Packaging requires Visual Studio 2022 17.14+ or Visual Studio 2026, the Game development with C++ workload, and MSVC 14.38+. Run Scripts\Check-Workstation.ps1 for details."
}
if (-not $windowsSdk.Found -or -not $windowsSdk.MeetsMinimumVersion) {
    throw "Packaging requires Windows SDK 10.0.22621.0 or newer. Run Scripts\Check-Workstation.ps1 for details."
}

$provenanceBeforeBuild = Get-CardioGitProvenance -ProjectRoot $projectRoot

if (-not $ArchiveDirectory) {
    $stamp = [DateTime]::UtcNow.ToString("yyyyMMdd-HHmmss")
    $ArchiveDirectory = Join-Path $projectRoot "PackagedBuilds\Win64-$Configuration-$stamp"
}
$ArchiveDirectory = Initialize-CardioOutputDirectory -Path $ArchiveDirectory -Purpose "Windows package archive"

Invoke-CardioCommand -FilePath $uatBat -ArgumentList @(
    "BuildCookRun",
    "-project=$projectFile",
    "-noP4",
    "-target=CardioHospital",
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
) -Description "Build, cook, and package CardioHospital for Windows"

$provenanceAfterBuild = Get-CardioGitProvenance -ProjectRoot $projectRoot
if ($provenanceAfterBuild.Commit -ne $provenanceBeforeBuild.Commit) {
    throw "Git HEAD changed while packaging. The archive was not given a manifest; rerun from a stable commit."
}

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
if (@($files).Count -eq 0) {
    throw "Unreal reported success but the archive contains no files: $ArchiveDirectory"
}

$generatedAtUtc = [DateTime]::UtcNow
$shortCommit = $provenanceAfterBuild.Commit.Substring(0, 12)
$packageId = "CardioHospital-Win64-$Configuration-$shortCommit-$($generatedAtUtc.ToString('yyyyMMddTHHmmssZ'))"

$manifest = [ordered]@{
    schemaVersion = 1
    packageId = $packageId
    generatedAtUtc = $generatedAtUtc.ToString("o")
    sourceCommit = $provenanceAfterBuild.Commit
    sourceState = $provenanceAfterBuild.WorktreeState
    sourceProjectPath = $provenanceAfterBuild.ProjectPath
    target = "CardioHospital"
    platform = "Win64"
    configuration = $Configuration
    engine = [ordered]@{
        version = $engineInspection.Version
    }
    toolchain = [ordered]@{
        visualStudioVersion = $visualStudio.Version
        msvcVersion = $visualStudio.CompilerVersion
        windowsSdkVersion = $windowsSdk.Version
    }
    walkthroughPassed = $false
    walkthrough = [ordered]@{
        packageId = $packageId
        status = "not-run"
        passed = $false
        requiredResolution = "2560x1440"
        evidence = $null
    }
    files = @($files)
}
$manifestPath = Join-Path $ArchiveDirectory "build-manifest.json"
$manifestJson = $manifest | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($manifestPath, "$manifestJson`n", [System.Text.UTF8Encoding]::new($false))

Write-Host "Windows package completed: $ArchiveDirectory" -ForegroundColor Green
Write-Host "The manifest intentionally records walkthroughPassed=false until the packaged build is run." -ForegroundColor Yellow
Write-Host "Next: follow WALKTHROUGH_CHECKLIST.md, then use Scripts\Record-WalkthroughEvidence.ps1 to attach a truthful failed or passing result." -ForegroundColor Cyan
