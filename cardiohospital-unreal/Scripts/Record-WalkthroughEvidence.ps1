[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$PackageDirectory,

    [Parameter(Mandatory)]
    [string]$WorkstationReportPath,

    [Parameter(Mandatory)]
    [ValidateSet("Passed", "Failed")]
    [string]$Outcome,

    [int[]]$PassedAcceptanceStep = @(),

    [Nullable[double]]$AverageFps,

    [Nullable[double]]$MinimumFps,

    [Nullable[double]]$FrameTimeP95Ms,

    [Nullable[int]]$DrawCalls,

    [Nullable[long]]$Triangles,

    [Nullable[double]]$GpuMemoryMB,

    [Nullable[double]]$TextureMemoryMB,

    [Nullable[int]]$NpcCount,

    [Nullable[double]]$StartupSeconds,

    [int]$ResolutionWidth = 2560,

    [int]$ResolutionHeight = 1440,

    [switch]$ConfirmExactPackageRun,

    [switch]$ConfirmStudioDriver,

    [string[]]$EvidenceArtifactPath = @(),

    [string]$Notes
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Unreal-Common.ps1")

if (-not $ConfirmExactPackageRun) {
    throw "No evidence was recorded. Pass -ConfirmExactPackageRun only after launching the executable from this exact package directory."
}

$packageRoot = [System.IO.Path]::GetFullPath($PackageDirectory).TrimEnd("\", "/")
if (-not (Test-Path -LiteralPath $packageRoot -PathType Container)) {
    throw "Package directory was not found: $packageRoot"
}
$packageBoundary = "$packageRoot$([System.IO.Path]::DirectorySeparatorChar)"
$manifestPath = Join-Path $packageRoot "build-manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "The package has no build-manifest.json: $packageRoot"
}

try {
    $manifestJsonBeforeEvidence = Get-Content -Raw -LiteralPath $manifestPath
    $manifest = $manifestJsonBeforeEvidence | ConvertFrom-Json
}
catch {
    throw "The package manifest is not valid JSON: $manifestPath. $($_.Exception.Message)"
}

$requiredManifestFields = @(
    "schemaVersion",
    "packageId",
    "sourceCommit",
    "sourceState",
    "target",
    "platform",
    "configuration",
    "walkthroughPassed",
    "walkthrough",
    "files"
)
$missingManifestFields = @(
    $requiredManifestFields | Where-Object { $manifest.PSObject.Properties.Name -notcontains $_ }
)
if ($missingManifestFields.Count -gt 0) {
    throw "The package manifest is missing required fields: $($missingManifestFields -join ', ')."
}
if ([string]$manifest.sourceState -ne "clean") {
    throw "Walkthrough evidence cannot be attached to a package whose sourceState is not clean."
}
if ([string]$manifest.platform -ne "Win64" -or [string]$manifest.target -ne "CardioHospital") {
    throw "The manifest does not describe the expected CardioHospital Win64 target."
}
if ([bool]$manifest.walkthroughPassed) {
    throw "This package already has passing walkthrough evidence. Create a new package for another acceptance run."
}
$packageId = [string]$manifest.packageId
if ($packageId -notmatch '^[A-Za-z0-9._-]+$') {
    throw "The manifest packageId is unsafe for an evidence filename: $packageId"
}

$manifestEntries = @($manifest.files)
if ($manifestEntries.Count -lt 1) {
    throw "The package manifest contains no file inventory."
}
$expectedPaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($entry in $manifestEntries) {
    $relativePath = ([string]$entry.path).Replace("\", "/").TrimStart("/")
    if (-not $relativePath -or [System.IO.Path]::IsPathRooted($relativePath) -or $relativePath -match '(^|/)\.\.(/|$)') {
        throw "The manifest contains an unsafe file path: $($entry.path)"
    }
    if (-not $expectedPaths.Add($relativePath)) {
        throw "The manifest contains a duplicate file path: $relativePath"
    }

    $filePath = [System.IO.Path]::GetFullPath((Join-Path $packageRoot $relativePath.Replace("/", "\")))
    if (-not $filePath.StartsWith($packageBoundary, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "A manifest path escapes the package directory: $relativePath"
    }
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        throw "A packaged file listed in the manifest is missing: $relativePath"
    }
    $fileInfo = Get-Item -LiteralPath $filePath
    if ([long]$entry.bytes -ne $fileInfo.Length) {
        throw "Packaged file size changed after manifest creation: $relativePath"
    }
    $actualHash = (Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ([string]$entry.sha256 -ne $actualHash) {
        throw "Packaged file hash changed after manifest creation: $relativePath"
    }
}

$actualPaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($file in @(Get-ChildItem -LiteralPath $packageRoot -Recurse -File)) {
    if ($file.FullName -eq $manifestPath) { continue }
    $relativePath = (Get-CardioRelativePath -BasePath $packageRoot -Path $file.FullName).Replace("\", "/")
    $actualPaths.Add($relativePath) | Out-Null
}
$unexpectedPaths = @($actualPaths | Where-Object { -not $expectedPaths.Contains($_) })
if ($unexpectedPaths.Count -gt 0) {
    throw "The package contains files that are not in its manifest: $($unexpectedPaths -join ', '). Create a fresh package or remove unrelated artifacts before recording evidence."
}

$executableEntries = @(
    $manifestEntries | Where-Object {
        [System.IO.Path]::GetFileName(([string]$_.path).Replace("/", "\")) -eq "CardioHospital.exe"
    }
)
if ($executableEntries.Count -ne 1) {
    throw "Expected exactly one CardioHospital.exe in the package manifest; found $($executableEntries.Count)."
}
$executableEntry = $executableEntries[0]

$workstationReportFullPath = [System.IO.Path]::GetFullPath($WorkstationReportPath)
if (-not (Test-Path -LiteralPath $workstationReportFullPath -PathType Leaf)) {
    throw "The workstation preflight report was not found: $workstationReportFullPath"
}
try {
    $workstationReport = Get-Content -Raw -LiteralPath $workstationReportFullPath | ConvertFrom-Json
}
catch {
    throw "The workstation preflight report is not valid JSON: $workstationReportFullPath. $($_.Exception.Message)"
}
if ([int]$workstationReport.SchemaVersion -lt 2) {
    throw "The workstation report schema is too old. Rerun Scripts\Run-Monday-Preflight.ps1."
}

$passedSteps = @($PassedAcceptanceStep | Sort-Object -Unique)
$invalidSteps = @($passedSteps | Where-Object { $_ -lt 1 -or $_ -gt 19 })
if ($invalidSteps.Count -gt 0) {
    throw "Acceptance step numbers must be between 1 and 19: $($invalidSteps -join ', ')."
}
$allAcceptanceStepsPassed = [bool](
    $passedSteps.Count -eq 19 -and
    -not (Compare-Object -ReferenceObject (1..19) -DifferenceObject $passedSteps)
)

$hasPerformanceMetrics = [bool](
    $null -ne $AverageFps -and
    $null -ne $MinimumFps -and
    $null -ne $FrameTimeP95Ms -and
    $null -ne $DrawCalls -and
    $null -ne $Triangles -and
    $null -ne $GpuMemoryMB -and
    $null -ne $TextureMemoryMB -and
    $null -ne $NpcCount -and
    $null -ne $StartupSeconds
)
$performanceTargetMet = [bool](
    $hasPerformanceMetrics -and
    $ResolutionWidth -eq 2560 -and
    $ResolutionHeight -eq 1440 -and
    [double]$AverageFps -ge 60 -and
    [double]$MinimumFps -gt 0 -and
    [double]$FrameTimeP95Ms -gt 0 -and
    [double]$FrameTimeP95Ms -le 16.7 -and
    [int]$DrawCalls -gt 0 -and
    [long]$Triangles -gt 0 -and
    [double]$GpuMemoryMB -gt 0 -and
    [double]$TextureMemoryMB -ge 0 -and
    [int]$NpcCount -ge 0 -and
    [double]$StartupSeconds -gt 0
)

$generatedAt = [DateTimeOffset]::MinValue
$workstationReportIsRecent = [DateTimeOffset]::TryParse([string]$workstationReport.GeneratedAtUtc, [ref]$generatedAt)
if ($workstationReportIsRecent) {
    $reportAge = [DateTimeOffset]::UtcNow - $generatedAt.ToUniversalTime()
    $workstationReportIsRecent = [bool]($reportAge.TotalMinutes -ge -5 -and $reportAge.TotalHours -le 24)
}

$artifactSources = [System.Collections.Generic.List[object]]::new()
$artifactNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($artifactPath in @($EvidenceArtifactPath)) {
    $artifactFullPath = [System.IO.Path]::GetFullPath($artifactPath)
    if (-not (Test-Path -LiteralPath $artifactFullPath -PathType Leaf)) {
        throw "Evidence artifact was not found: $artifactFullPath"
    }
    if ($artifactFullPath.StartsWith($packageBoundary, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Evidence artifacts must be supplied from outside the immutable package directory: $artifactFullPath"
    }
    $artifactName = [System.IO.Path]::GetFileName($artifactFullPath)
    if (-not $artifactNames.Add($artifactName)) {
        throw "Evidence artifact filenames must be unique: $artifactName"
    }
    $artifactSources.Add([pscustomobject]@{
        FullPath = $artifactFullPath
        Name = $artifactName
    })
}

if ($Outcome -eq "Passed") {
    $passFailures = [System.Collections.Generic.List[string]]::new()
    if (-not [bool]$workstationReport.Passed) { $passFailures.Add("the workstation preflight report did not pass") }
    if (-not $workstationReportIsRecent) { $passFailures.Add("the workstation preflight report is not from the last 24 hours") }
    if (-not $ConfirmStudioDriver) { $passFailures.Add("the current NVIDIA Studio Driver was not explicitly confirmed") }
    if (-not $allAcceptanceStepsPassed) { $passFailures.Add("all 19 acceptance steps were not explicitly supplied") }
    if ($artifactSources.Count -lt 1) { $passFailures.Add("no performance capture artifact was supplied") }
    if (-not $hasPerformanceMetrics) { $passFailures.Add("one or more required performance metrics are missing") }
    elseif (-not $performanceTargetMet) { $passFailures.Add("the 2560x1440 stable-60-FPS evidence threshold was not met") }
    if ($passFailures.Count -gt 0) {
        throw "Passing evidence was not recorded because $($passFailures -join '; '). Record Outcome=Failed or rerun the exact package after correcting the gate."
    }
}
elseif ([string]::IsNullOrWhiteSpace($Notes)) {
    throw "Failed walkthrough evidence requires -Notes describing the failed step or performance gate. Do not include PHI, credentials, or personal identifiers."
}

$recordedAt = [DateTimeOffset]::UtcNow
$outcomeKey = $Outcome.ToLowerInvariant()
$evidenceId = "$packageId-$($recordedAt.ToString('yyyyMMddTHHmmssfffZ'))-$outcomeKey"
$evidenceRelativePath = "WalkthroughEvidence/$evidenceId.json"
$evidencePath = Join-Path $packageRoot $evidenceRelativePath.Replace("/", "\")
$evidenceDirectory = Split-Path -Parent $evidencePath
New-Item -ItemType Directory -Path $evidenceDirectory -Force | Out-Null
if (Test-Path -LiteralPath $evidencePath) {
    throw "The evidence file already exists: $evidencePath"
}

$workstationReportHash = (Get-FileHash -LiteralPath $workstationReportFullPath -Algorithm SHA256).Hash.ToLowerInvariant()
$manifestHashBeforeEvidence = (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
$artifactReferences = [System.Collections.Generic.List[object]]::new()
$artifactManifestEntries = [System.Collections.Generic.List[object]]::new()
foreach ($artifactSource in $artifactSources) {
    $artifactRelativePath = "WalkthroughEvidence/$evidenceId/$($artifactSource.Name)"
    $artifactDestination = Join-Path $packageRoot $artifactRelativePath.Replace("/", "\")
    $artifactDestinationDirectory = Split-Path -Parent $artifactDestination
    New-Item -ItemType Directory -Path $artifactDestinationDirectory -Force | Out-Null
    Copy-Item -LiteralPath $artifactSource.FullPath -Destination $artifactDestination -ErrorAction Stop
    $artifactInfo = Get-Item -LiteralPath $artifactDestination
    $artifactHash = (Get-FileHash -LiteralPath $artifactDestination -Algorithm SHA256).Hash.ToLowerInvariant()
    $artifactReferences.Add([pscustomobject][ordered]@{
        path = $artifactRelativePath
        bytes = $artifactInfo.Length
        sha256 = $artifactHash
    })
    $artifactManifestEntries.Add([pscustomobject][ordered]@{
        path = $artifactRelativePath
        bytes = $artifactInfo.Length
        sha256 = $artifactHash
    })
}
$evidence = [ordered]@{
    schemaVersion = 1
    evidenceId = $evidenceId
    recordedAtUtc = $recordedAt.ToString("o")
    outcome = $outcomeKey
    exactPackagedExecutableRunConfirmed = $true
    privacyNotice = "No PHI, credentials, operator identity, or institutional secrets belong in this evidence."
    package = [ordered]@{
        packageId = $packageId
        sourceCommit = [string]$manifest.sourceCommit
        configuration = [string]$manifest.configuration
        manifestSha256BeforeEvidence = $manifestHashBeforeEvidence
        executablePath = [string]$executableEntry.path
        executableSha256 = [string]$executableEntry.sha256
    }
    workstation = [ordered]@{
        reportSchemaVersion = [int]$workstationReport.SchemaVersion
        reportGeneratedAtUtc = [string]$workstationReport.GeneratedAtUtc
        reportSha256 = $workstationReportHash
        preflightPassed = [bool]$workstationReport.Passed
        windowsBuild = $workstationReport.Windows.BuildNumber
        memoryGB = $workstationReport.Memory.InstalledGB
        gpu = $workstationReport.GPU.Selected
        gpuDriverVersion = $workstationReport.GPU.DriverVersion
        unrealVersion = $workstationReport.Unreal.Version
        visualStudioVersion = $workstationReport.VisualStudio.Version
        msvcVersion = $workstationReport.VisualStudio.MsvcVersion
        windowsSdkVersion = $workstationReport.WindowsSdk.Version
        studioDriverConfirmed = [bool]$ConfirmStudioDriver
    }
    acceptance = [ordered]@{
        checklist = "WALKTHROUGH_CHECKLIST.md"
        checklistVersion = 1
        requiredStepCount = 19
        passedSteps = $passedSteps
        allStepsPassed = $allAcceptanceStepsPassed
    }
    performance = [ordered]@{
        requiredResolution = "2560x1440"
        width = $ResolutionWidth
        height = $ResolutionHeight
        averageFps = if ($null -ne $AverageFps) { [double]$AverageFps } else { $null }
        minimumFps = if ($null -ne $MinimumFps) { [double]$MinimumFps } else { $null }
        frameTimeP95Ms = if ($null -ne $FrameTimeP95Ms) { [double]$FrameTimeP95Ms } else { $null }
        drawCalls = if ($null -ne $DrawCalls) { [int]$DrawCalls } else { $null }
        triangles = if ($null -ne $Triangles) { [long]$Triangles } else { $null }
        gpuMemoryMB = if ($null -ne $GpuMemoryMB) { [double]$GpuMemoryMB } else { $null }
        textureMemoryMB = if ($null -ne $TextureMemoryMB) { [double]$TextureMemoryMB } else { $null }
        npcCount = if ($null -ne $NpcCount) { [int]$NpcCount } else { $null }
        startupSeconds = if ($null -ne $StartupSeconds) { [double]$StartupSeconds } else { $null }
        targetMet = $performanceTargetMet
    }
    artifacts = @($artifactReferences)
    notes = if ($Notes) { $Notes.Trim() } else { $null }
}

$evidenceJson = $evidence | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($evidencePath, "$evidenceJson`n", [System.Text.UTF8Encoding]::new($false))
$evidenceFileInfo = Get-Item -LiteralPath $evidencePath
$evidenceHash = (Get-FileHash -LiteralPath $evidencePath -Algorithm SHA256).Hash.ToLowerInvariant()
$newEvidenceFileEntry = [pscustomobject][ordered]@{
    path = $evidenceRelativePath
    bytes = $evidenceFileInfo.Length
    sha256 = $evidenceHash
}
$manifest.files = @($manifest.files) + @($artifactManifestEntries) + @($newEvidenceFileEntry) | Sort-Object path

$previousEvidence = @($manifest.walkthrough.evidence | Where-Object { $null -ne $_ })
$evidenceReference = [pscustomobject][ordered]@{
    path = $evidenceRelativePath
    sha256 = $evidenceHash
    outcome = $outcomeKey
    recordedAtUtc = $recordedAt.ToString("o")
}
$manifest.walkthrough.evidence = @($previousEvidence) + @($evidenceReference)
$manifest.walkthrough.status = $outcomeKey
$manifest.walkthrough.passed = ($Outcome -eq "Passed")
$manifest.walkthroughPassed = ($Outcome -eq "Passed")

$updatedManifestJson = $manifest | ConvertTo-Json -Depth 10
$temporaryManifestPath = "$manifestPath.$([Guid]::NewGuid().ToString('N')).tmp"
try {
    [System.IO.File]::WriteAllText($temporaryManifestPath, "$updatedManifestJson`n", [System.Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temporaryManifestPath -Destination $manifestPath -Force
}
finally {
    if (Test-Path -LiteralPath $temporaryManifestPath) {
        Remove-Item -LiteralPath $temporaryManifestPath -Force -ErrorAction SilentlyContinue
    }
}

if ($Outcome -eq "Passed") {
    Write-Host "Passing walkthrough evidence recorded for package $packageId." -ForegroundColor Green
}
else {
    Write-Host "Failed walkthrough evidence recorded; walkthroughPassed remains false for package $packageId." -ForegroundColor Yellow
}
Write-Host "Evidence: $evidencePath" -ForegroundColor Cyan
