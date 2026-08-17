Set-StrictMode -Version Latest

. (Join-Path $PSScriptRoot "Unreal-Common.ps1")

function Get-CardioFirstBuildUtcTimestamp {
    return [DateTimeOffset]::UtcNow.ToString("o")
}

function Get-CardioFirstBuildStringHash {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Value
    )

    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($Value)
        $hash = $algorithm.ComputeHash($bytes)
        return ([BitConverter]::ToString($hash)).Replace("-", "").ToLowerInvariant()
    }
    finally {
        $algorithm.Dispose()
    }
}

function Test-CardioFirstBuildPathInsideProject {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ProjectRoot,

        [Parameter(Mandatory)]
        [string]$Path
    )

    $projectFullPath = [System.IO.Path]::GetFullPath($ProjectRoot).TrimEnd("\", "/")
    $pathFullPath = [System.IO.Path]::GetFullPath($Path)
    $boundary = "$projectFullPath$([System.IO.Path]::DirectorySeparatorChar)"
    return (
        $pathFullPath.Equals($projectFullPath, [System.StringComparison]::OrdinalIgnoreCase) -or
        $pathFullPath.StartsWith($boundary, [System.StringComparison]::OrdinalIgnoreCase)
    )
}

function Get-CardioFirstBuildSourceFingerprint {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ProjectRoot
    )

    $projectFullPath = [System.IO.Path]::GetFullPath($ProjectRoot)
    $git = Get-Command git.exe -ErrorAction SilentlyContinue
    if (-not $git) { $git = Get-Command git -ErrorAction SilentlyContinue }
    if (-not $git) {
        throw "Git for Windows is required to inventory the first-build source for safe resume."
    }

    $paths = @(
        & $git.Source -C $projectFullPath -c core.quotepath=false ls-files --cached --others --exclude-standard -- . 2>$null
    )
    if ($LASTEXITCODE -ne 0) {
        throw "Git could not inventory tracked and untracked project source for safe resume: $projectFullPath"
    }

    $descriptors = [System.Collections.Generic.List[string]]::new()
    foreach ($relativePathValue in @($paths | Sort-Object -Unique)) {
        $relativePath = [string]$relativePathValue
        if ([string]::IsNullOrWhiteSpace($relativePath)) { continue }

        $candidate = Join-Path $projectFullPath $relativePath
        $fullPath = [System.IO.Path]::GetFullPath($candidate)
        if (-not (Test-CardioFirstBuildPathInsideProject -ProjectRoot $projectFullPath -Path $fullPath)) {
            throw "Git returned a project path outside the Unreal project boundary: $relativePath"
        }

        $portablePath = $relativePath.Replace("\", "/")
        if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
            $file = Get-Item -LiteralPath $fullPath -Force -ErrorAction Stop
            $fileHash = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash.ToLowerInvariant()
            $descriptors.Add("file`0$portablePath`0$($file.Length)`0$fileHash")
        }
        else {
            $descriptors.Add("missing`0$portablePath")
        }
    }

    $inventory = @($descriptors) -join "`n"
    return Get-CardioFirstBuildStringHash -Value $inventory
}

function Get-CardioFirstBuildEnvironmentFingerprint {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$WorkstationReportPath
    )

    if (-not (Test-Path -LiteralPath $WorkstationReportPath -PathType Leaf)) {
        throw "The workstation report required for the resume environment fingerprint is missing: $WorkstationReportPath"
    }
    try {
        $workstation = Get-Content -Raw -LiteralPath $WorkstationReportPath -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        throw "The workstation report cannot be used for the resume environment fingerprint: $($_.Exception.Message)"
    }
    if (-not [bool]$workstation.Passed) {
        throw "The workstation report did not pass and cannot authorize reuse of build evidence: $WorkstationReportPath"
    }

    $normalized = [ordered]@{
        windowsBuild = [string]$workstation.Windows.BuildNumber
        memoryGB = [string]$workstation.Memory.InstalledGB
        gpu = [string]$workstation.GPU.Selected
        gpuDriver = [string]$workstation.GPU.DriverVersion
        unrealVersion = [string]$workstation.Unreal.Version
        unrealRoot = [string]$workstation.Unreal.Root
        visualStudioVersion = [string]$workstation.VisualStudio.Version
        visualStudioRoot = [string]$workstation.VisualStudio.InstallationPath
        msvcVersion = [string]$workstation.VisualStudio.MsvcVersion
        windowsSdkVersion = [string]$workstation.WindowsSdk.Version
        windowsSdkRoot = [string]$workstation.WindowsSdk.Root
        nodeVersion = [string]$workstation.Node.Version
        nodePath = [string]$workstation.Node.Path
    }
    return Get-CardioFirstBuildStringHash -Value ($normalized | ConvertTo-Json -Compress)
}

function New-CardioFirstBuildArtifact {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ProjectRoot,

        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter(Mandatory)]
        [string]$Kind
    )

    $projectFullPath = [System.IO.Path]::GetFullPath($ProjectRoot)
    $candidate = if ([System.IO.Path]::IsPathRooted($Path)) {
        $Path
    }
    else {
        Join-Path $projectFullPath $Path
    }
    $fullPath = [System.IO.Path]::GetFullPath($candidate)
    if (-not (Test-CardioFirstBuildPathInsideProject -ProjectRoot $projectFullPath -Path $fullPath)) {
        throw "First-build evidence must remain inside the Unreal project boundary: $fullPath"
    }
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        throw "The stage command returned success without creating its required evidence file: $fullPath"
    }

    $file = Get-Item -LiteralPath $fullPath -Force -ErrorAction Stop
    return [ordered]@{
        kind = $Kind
        path = (Get-CardioRelativePath -BasePath $projectFullPath -Path $fullPath).Replace("\", "/")
        bytes = [long]$file.Length
        sha256 = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}

function Test-CardioFirstBuildArtifacts {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ProjectRoot,

        [AllowNull()]
        [object[]]$Artifacts
    )

    if (@($Artifacts).Count -lt 1) { return $false }
    $projectFullPath = [System.IO.Path]::GetFullPath($ProjectRoot)
    foreach ($artifact in @($Artifacts)) {
        if ($null -eq $artifact) { return $false }
        if (
            $artifact.PSObject.Properties.Name -notcontains "path" -or
            $artifact.PSObject.Properties.Name -notcontains "bytes" -or
            $artifact.PSObject.Properties.Name -notcontains "sha256"
        ) {
            return $false
        }

        $relativePath = [string]$artifact.path
        if (-not $relativePath -or [System.IO.Path]::IsPathRooted($relativePath)) { return $false }
        try {
            $fullPath = [System.IO.Path]::GetFullPath((Join-Path $projectFullPath $relativePath))
        }
        catch {
            return $false
        }
        if (-not (Test-CardioFirstBuildPathInsideProject -ProjectRoot $projectFullPath -Path $fullPath)) {
            return $false
        }
        if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) { return $false }

        $file = Get-Item -LiteralPath $fullPath -Force -ErrorAction Stop
        if ([long]$artifact.bytes -ne [long]$file.Length) { return $false }
        $actualHash = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actualHash -ne ([string]$artifact.sha256).ToLowerInvariant()) { return $false }
    }
    return $true
}

function Test-CardioFirstBuildPackageConfiguration {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ProjectRoot,

        [AllowNull()]
        [object[]]$Artifacts,

        [Parameter(Mandatory)]
        [string]$Configuration
    )

    $manifestArtifact = $Artifacts | Where-Object { $_.kind -eq "package-manifest" } | Select-Object -First 1
    if (-not $manifestArtifact -or -not $manifestArtifact.path) { return $false }
    try {
        $manifestPath = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot ([string]$manifestArtifact.path)))
        if (-not (Test-CardioFirstBuildPathInsideProject -ProjectRoot $ProjectRoot -Path $manifestPath)) { return $false }
        $manifest = Get-Content -Raw -LiteralPath $manifestPath -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
        return ([string]$manifest.configuration -eq $Configuration)
    }
    catch {
        return $false
    }
}

function Resolve-CardioFirstBuildReportPath {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ProjectRoot,

        [string]$ReportPath,

        [Parameter(Mandatory)]
        [string]$RunId
    )

    $projectFullPath = [System.IO.Path]::GetFullPath($ProjectRoot).TrimEnd("\", "/")
    $candidate = if ($ReportPath) {
        if ([System.IO.Path]::IsPathRooted($ReportPath)) {
            $ReportPath
        }
        else {
            Join-Path $projectFullPath $ReportPath
        }
    }
    else {
        Join-Path $projectFullPath "Saved\FirstBuildReports\first-build-$RunId.json"
    }
    $fullPath = [System.IO.Path]::GetFullPath($candidate)
    if ([System.IO.Path]::GetExtension($fullPath) -ne ".json") {
        throw "The first-build report path must end in .json."
    }
    if (Test-Path -LiteralPath $fullPath) {
        throw "The first-build report path already exists; choose a new filename so an earlier run is never overwritten: $fullPath"
    }

    if (Test-CardioFirstBuildPathInsideProject -ProjectRoot $projectFullPath -Path $fullPath) {
        $savedRoot = [System.IO.Path]::GetFullPath((Join-Path $projectFullPath "Saved")).TrimEnd("\", "/")
        $savedBoundary = "$savedRoot$([System.IO.Path]::DirectorySeparatorChar)"
        if (-not $fullPath.StartsWith($savedBoundary, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "First-build reports inside the Unreal project must be under Saved: $fullPath"
        }
    }

    $parent = Split-Path -Parent $fullPath
    if (-not $parent) { throw "The first-build report path has no parent directory." }
    New-Item -ItemType Directory -Path $parent -Force -ErrorAction Stop | Out-Null
    return $fullPath
}

function Write-CardioFirstBuildReport {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [System.Collections.IDictionary]$Report,

        [Parameter(Mandatory)]
        [string]$Path,

        [switch]$Create
    )

    $json = $Report | ConvertTo-Json -Depth 20
    $encoding = [System.Text.UTF8Encoding]::new($false)
    if ($Create) {
        $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::Read)
        try {
            $writer = [System.IO.StreamWriter]::new($stream, $encoding)
            try { $writer.Write("$json`n") }
            finally { $writer.Dispose() }
        }
        finally {
            if ($null -ne $stream) { $stream.Dispose() }
        }
        return
    }

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "The active first-build report disappeared and will not be recreated automatically: $Path"
    }
    $temporaryPath = Join-Path (Split-Path -Parent $Path) ("." + [System.IO.Path]::GetFileName($Path) + ".tmp-" + [Guid]::NewGuid().ToString("N"))
    try {
        [System.IO.File]::WriteAllText($temporaryPath, "$json`n", $encoding)
        Move-Item -LiteralPath $temporaryPath -Destination $Path -Force -ErrorAction Stop
    }
    finally {
        if (Test-Path -LiteralPath $temporaryPath -PathType Leaf) {
            Remove-Item -LiteralPath $temporaryPath -Force -ErrorAction SilentlyContinue
        }
    }
}

function Get-CardioFirstBuildResumeCommand {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$CommandPath,

        [Parameter(Mandatory)]
        [string]$ReportPath,

        [Parameter(Mandatory)]
        [System.Collections.IDictionary]$Options,

        [switch]$IncludePackage
    )

    $quote = {
        param([string]$Value)
        return "'" + $Value.Replace("'", "''") + "'"
    }
    $parts = [System.Collections.Generic.List[string]]::new()
    $parts.Add("powershell.exe -NoProfile -ExecutionPolicy Bypass -File $(& $quote ([System.IO.Path]::GetFullPath($CommandPath)))")
    $parts.Add("-ResumeReportPath $(& $quote ([System.IO.Path]::GetFullPath($ReportPath)))")
    if ($Options.engineRoot) { $parts.Add("-EngineRoot $(& $quote ([string]$Options.engineRoot))") }
    $parts.Add("-MinimumFreeDiskGB $([int]$Options.minimumFreeDiskGB)")
    $parts.Add("-Configuration $([string]$Options.configuration)")
    if ($IncludePackage) { $parts.Add("-IncludePackage") }
    return @($parts) -join " "
}

function New-CardioFirstBuildStageRecord {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter(Mandatory)]
        [string]$DisplayName,

        [Parameter(Mandatory)]
        [bool]$Required,

        [Parameter(Mandatory)]
        [bool]$Enabled
    )

    return [ordered]@{
        name = $Name
        displayName = $DisplayName
        required = $Required
        enabled = $Enabled
        status = if ($Enabled) { "not-run" } else { "not-requested" }
        startedAtUtc = $null
        completedAtUtc = $null
        durationSeconds = $null
        sourceFingerprintBeforeStage = $null
        sourceFingerprintAfterStage = $null
        sourceChangedDuringStage = $false
        environmentFingerprint = $null
        artifacts = @()
        reusedFromRunId = $null
        blockedBy = $null
        error = $null
    }
}

function Update-CardioFirstBuildEvidenceOutputs {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ProjectRoot,

        [Parameter(Mandatory)]
        [System.Collections.IDictionary]$Report,

        [Parameter(Mandatory)]
        [System.Collections.IDictionary]$Stage
    )

    $artifact = $null
    if ($Stage.name -eq "automation") {
        $artifact = $Stage.artifacts | Where-Object { $_.kind -eq "automation-report" } | Select-Object -First 1
        if ($artifact) {
            $Report.outputs.automationReport = Split-Path -Parent ([System.IO.Path]::GetFullPath((Join-Path $ProjectRoot ([string]$artifact.path))))
        }
    }
    elseif ($Stage.name -eq "package") {
        $artifact = $Stage.artifacts | Where-Object { $_.kind -eq "package-manifest" } | Select-Object -First 1
        if ($artifact) {
            $Report.outputs.packageDirectory = Split-Path -Parent ([System.IO.Path]::GetFullPath((Join-Path $ProjectRoot ([string]$artifact.path))))
        }
    }
}

function Update-CardioFirstBuildSummary {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [System.Collections.IDictionary]$Report
    )

    $baselineNames = @("preflight", "validation", "project-generation", "editor-build", "automation")
    $baselinePassed = $true
    foreach ($name in $baselineNames) {
        $stage = $Report.stages | Where-Object { $_.name -eq $name } | Select-Object -First 1
        if (-not $stage -or @("passed", "reused") -notcontains [string]$stage.status) {
            $baselinePassed = $false
            break
        }
    }
    $Report.baseline.status = if ($baselinePassed) { "passed" } else { "not-passed" }
    $Report.baseline.passed = [bool]$baselinePassed

    $packageStage = $Report.stages | Where-Object { $_.name -eq "package" } | Select-Object -First 1
    if (-not $packageStage.enabled) {
        $Report.package.status = "not-requested"
        $Report.package.manifestPath = $null
    }
    elseif ($packageStage.status -eq "passed") {
        $Report.package.status = "created"
    }
    elseif ($packageStage.status -eq "reused") {
        $Report.package.status = "reused"
    }
    else {
        $Report.package.status = [string]$packageStage.status
    }
    if (@("passed", "reused") -contains [string]$packageStage.status) {
        $manifest = @($packageStage.artifacts | Where-Object { $_.kind -eq "package-manifest" } | Select-Object -First 1)
        if ($manifest.Count -gt 0) { $Report.package.manifestPath = [string]$manifest[0].path }
    }
}

function Invoke-CardioFirstBuildPlan {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ProjectRoot,

        [Parameter(Mandatory)]
        [string]$RunId,

        [string]$ReportPath,

        [string]$ResumeReportPath,

        [switch]$RerunAll,

        [Parameter(Mandatory)]
        [object[]]$StageDefinitions,

        [Parameter(Mandatory)]
        [System.Collections.IDictionary]$Context,

        [Parameter(Mandatory)]
        [System.Collections.IDictionary]$Options,

        [Parameter(Mandatory)]
        [string]$CommandPath,

        [scriptblock]$FingerprintProvider = { param($Root) Get-CardioFirstBuildSourceFingerprint -ProjectRoot $Root },

        [scriptblock]$EnvironmentFingerprintProvider = { param($State) Get-CardioFirstBuildEnvironmentFingerprint -WorkstationReportPath $State.workstationReportPath }
    )

    $projectFullPath = [System.IO.Path]::GetFullPath($ProjectRoot)
    $expectedStageNames = @("preflight", "validation", "project-generation", "editor-build", "automation", "package")
    $actualStageNames = @($StageDefinitions | ForEach-Object { [string]$_.Name })
    if (($actualStageNames -join "|") -ne ($expectedStageNames -join "|")) {
        throw "The first-build stage plan must remain preflight -> validation -> project-generation -> editor-build -> automation -> package."
    }

    $resolvedReportPath = Resolve-CardioFirstBuildReportPath -ProjectRoot $projectFullPath -ReportPath $ReportPath -RunId $RunId
    $stageRecords = @(
        foreach ($definition in $StageDefinitions) {
            New-CardioFirstBuildStageRecord `
                -Name ([string]$definition.Name) `
                -DisplayName ([string]$definition.DisplayName) `
                -Required ([bool]$definition.Required) `
                -Enabled ([bool]$definition.Enabled)
        }
    )
    $resumeCommand = Get-CardioFirstBuildResumeCommand -CommandPath $CommandPath -ReportPath $resolvedReportPath -Options $Options -IncludePackage:([bool]$Options.includePackage)
    $packageResumeCommand = Get-CardioFirstBuildResumeCommand -CommandPath $CommandPath -ReportPath $resolvedReportPath -Options $Options -IncludePackage
    $report = [ordered]@{
        schemaVersion = 2
        runId = $RunId
        startedAtUtc = Get-CardioFirstBuildUtcTimestamp
        completedAtUtc = $null
        status = "running"
        standardUserSafe = $true
        requiresElevationToRun = $false
        installsSoftware = $false
        project = [ordered]@{
            uproject = "CardioHospital.uproject"
        }
        options = [ordered]@{
            includePackage = [bool]$Options.includePackage
            configuration = [string]$Options.configuration
            minimumFreeDiskGB = [int]$Options.minimumFreeDiskGB
            engineRoot = if ($Options.engineRoot) { [string]$Options.engineRoot } else { $null }
        }
        outputs = [ordered]@{
            workstationReport = [string]$Context.workstationReportPath
            automationReport = [string]$Context.automationReportPath
            packageDirectory = if ($Options.includePackage) { [string]$Context.packageDirectory } else { $null }
        }
        resume = [ordered]@{
            requested = [bool]$ResumeReportPath
            rerunAll = [bool]$RerunAll
            priorReportPath = $null
            priorReportSha256 = $null
            priorRunId = $null
            optionCompatibility = [ordered]@{
                configurationMatches = $null
                packageReuseAllowed = $null
            }
        }
        source = [ordered]@{
            fingerprintAlgorithm = "sha256-git-project-content-v1"
            currentFingerprint = $null
        }
        environment = [ordered]@{
            fingerprintAlgorithm = "sha256-normalized-workstation-v1"
            currentFingerprint = $null
        }
        stages = $stageRecords
        baseline = [ordered]@{
            status = "not-passed"
            passed = $false
        }
        package = [ordered]@{
            requested = [bool]$Options.includePackage
            status = if ($Options.includePackage) { "not-run" } else { "not-requested" }
            manifestPath = $null
        }
        walkthrough = [ordered]@{
            status = "not-evaluated"
            passed = $false
            note = "A packaged-build walkthrough is a separate evidence gate and is never inferred from this build run."
        }
        error = $null
        nextAction = "Run the first-build stages."
        resumeCommand = $resumeCommand
        packageResumeCommand = $packageResumeCommand
    }
    Write-CardioFirstBuildReport -Report $report -Path $resolvedReportPath -Create

    $priorReport = $null
    $packageReuseAllowed = $true
    if ($ResumeReportPath) {
        try {
            $resumeCandidate = if ([System.IO.Path]::IsPathRooted($ResumeReportPath)) {
                $ResumeReportPath
            }
            else {
                Join-Path $projectFullPath $ResumeReportPath
            }
            $resolvedResumePath = [System.IO.Path]::GetFullPath($resumeCandidate)
            if (-not (Test-Path -LiteralPath $resolvedResumePath -PathType Leaf)) {
                throw "The resume report does not exist: $resolvedResumePath"
            }
            if ([System.IO.Path]::GetExtension($resolvedResumePath) -ne ".json") {
                throw "The resume report must be a .json file: $resolvedResumePath"
            }
            $priorReport = Get-Content -Raw -LiteralPath $resolvedResumePath -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
            if ([int]$priorReport.schemaVersion -ne 2 -or -not $priorReport.runId -or @($priorReport.stages).Count -ne 6) {
                throw "The resume report is not a supported first-build stage report: $resolvedResumePath"
            }
            if (
                $priorReport.PSObject.Properties.Name -notcontains "options" -or
                $priorReport.options.PSObject.Properties.Name -notcontains "configuration"
            ) {
                throw "The resume report does not record its package configuration: $resolvedResumePath"
            }
            $priorStageNames = @($priorReport.stages | ForEach-Object { [string]$_.name })
            if (($priorStageNames -join "|") -ne ($expectedStageNames -join "|")) {
                throw "The resume report stage order is not supported: $resolvedResumePath"
            }
            foreach ($priorStageRecord in @($priorReport.stages)) {
                $requiredProperties = @("status", "sourceFingerprintAfterStage", "environmentFingerprint", "artifacts")
                $missingProperties = @($requiredProperties | Where-Object { $priorStageRecord.PSObject.Properties.Name -notcontains $_ })
                if ($missingProperties.Count -gt 0) {
                    throw "The resume report stage '$($priorStageRecord.name)' is missing: $($missingProperties -join ', ')."
                }
            }
            $report.resume.priorReportPath = $resolvedResumePath
            $report.resume.priorReportSha256 = (Get-FileHash -LiteralPath $resolvedResumePath -Algorithm SHA256).Hash.ToLowerInvariant()
            $report.resume.priorRunId = [string]$priorReport.runId
            $configurationMatches = ([string]$priorReport.options.configuration -eq [string]$Options.configuration)
            $packageReuseAllowed = [bool]$configurationMatches
            $report.resume.optionCompatibility.configurationMatches = [bool]$configurationMatches
            $report.resume.optionCompatibility.packageReuseAllowed = [bool]$packageReuseAllowed
            Write-CardioFirstBuildReport -Report $report -Path $resolvedReportPath
        }
        catch {
            $report.status = "failed"
            $report.completedAtUtc = Get-CardioFirstBuildUtcTimestamp
            $report.error = [ordered]@{
                stage = "resume"
                type = $_.Exception.GetType().FullName
                message = $_.Exception.Message
            }
            $report.nextAction = "Correct -ResumeReportPath or omit it to start a fresh run. No stages were marked passed."
            Write-CardioFirstBuildReport -Report $report -Path $resolvedReportPath
            throw "First-build resume setup failed. Report: $resolvedReportPath. $($_.Exception.Message)"
        }
    }

    $allowReuse = [bool]($priorReport -and -not $RerunAll)
    $currentFingerprint = $null
    $currentEnvironmentFingerprint = $null
    for ($index = 0; $index -lt $StageDefinitions.Count; $index++) {
        $definition = $StageDefinitions[$index]
        $stage = $report.stages[$index]
        if (-not [bool]$definition.Enabled) { continue }

        $canReuse = $false
        $priorStage = $null
        if ($index -gt 0 -and $allowReuse) {
            $priorStage = $priorReport.stages | Where-Object { $_.name -eq $definition.Name } | Select-Object -First 1
            $artifactsMatch = $false
            if ($priorStage) {
                $artifactsMatch = Test-CardioFirstBuildArtifacts -ProjectRoot $projectFullPath -Artifacts @($priorStage.artifacts)
                if ($artifactsMatch -and $definition.Name -eq "package") {
                    $artifactsMatch = Test-CardioFirstBuildPackageConfiguration `
                        -ProjectRoot $projectFullPath `
                        -Artifacts @($priorStage.artifacts) `
                        -Configuration ([string]$Options.configuration)
                }
            }
            if (
                $priorStage -and
                @("passed", "reused") -contains [string]$priorStage.status -and
                [string]$priorStage.sourceFingerprintAfterStage -eq [string]$currentFingerprint -and
                [string]$priorStage.environmentFingerprint -eq [string]$currentEnvironmentFingerprint -and
                ($definition.Name -ne "package" -or $packageReuseAllowed) -and
                $artifactsMatch
            ) {
                $canReuse = $true
            }
        }

        if ($canReuse) {
            $now = Get-CardioFirstBuildUtcTimestamp
            $stage.status = "reused"
            $stage.startedAtUtc = $now
            $stage.completedAtUtc = $now
            $stage.durationSeconds = 0
            $stage.sourceFingerprintBeforeStage = [string]$currentFingerprint
            $stage.sourceFingerprintAfterStage = [string]$currentFingerprint
            $stage.sourceChangedDuringStage = $false
            $stage.environmentFingerprint = [string]$currentEnvironmentFingerprint
            $stage.artifacts = @($priorStage.artifacts)
            $stage.reusedFromRunId = [string]$priorReport.runId
            Update-CardioFirstBuildEvidenceOutputs -ProjectRoot $projectFullPath -Report $report -Stage $stage
            Update-CardioFirstBuildSummary -Report $report
            Write-CardioFirstBuildReport -Report $report -Path $resolvedReportPath
            Write-Host "==> Reused verified stage: $($definition.DisplayName)" -ForegroundColor DarkCyan
            continue
        }

        if ($index -gt 0) { $allowReuse = $false }
        $stage.status = "running"
        $stage.startedAtUtc = Get-CardioFirstBuildUtcTimestamp
        $stage.sourceFingerprintBeforeStage = [string]$currentFingerprint
        $report.nextAction = "Allow the '$($definition.Name)' stage to finish, or resume this report if it stops."
        Write-CardioFirstBuildReport -Report $report -Path $resolvedReportPath
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            & $definition.Action $Context | Out-Host
            $artifactValues = @(& $definition.ArtifactProvider $Context)
            if ($artifactValues.Count -lt 1) {
                throw "The stage has no machine-verifiable evidence artifact."
            }
            $fingerprintValues = @(& $FingerprintProvider $projectFullPath)
            if ($fingerprintValues.Count -ne 1 -or -not [string]$fingerprintValues[0]) {
                throw "The source fingerprint provider did not return exactly one non-empty fingerprint."
            }
            $nextFingerprint = [string]$fingerprintValues[0]
            $sourceChangedDuringStage = [bool](
                $null -ne $currentFingerprint -and
                [string]$currentFingerprint -ne [string]$nextFingerprint
            )
            $stage.sourceFingerprintAfterStage = $nextFingerprint
            $stage.sourceChangedDuringStage = $sourceChangedDuringStage
            $stage.artifacts = $artifactValues
            $report.source.currentFingerprint = $nextFingerprint

            if ($index -eq 0) {
                $environmentValues = @(& $EnvironmentFingerprintProvider $Context)
                if ($environmentValues.Count -ne 1 -or -not [string]$environmentValues[0]) {
                    throw "The workstation environment fingerprint provider did not return exactly one non-empty fingerprint."
                }
                $currentEnvironmentFingerprint = [string]$environmentValues[0]
                $report.environment.currentFingerprint = $currentEnvironmentFingerprint
            }
            $stage.environmentFingerprint = [string]$currentEnvironmentFingerprint

            if ($index -ge 2 -and $sourceChangedDuringStage) {
                throw "Project source changed while '$($definition.Name)' was running. The stage cannot be trusted; stop concurrent edits and resume from this report."
            }
            $currentFingerprint = $nextFingerprint
            $stopwatch.Stop()
            $stage.status = "passed"
            $stage.completedAtUtc = Get-CardioFirstBuildUtcTimestamp
            $stage.durationSeconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 3)
            Update-CardioFirstBuildEvidenceOutputs -ProjectRoot $projectFullPath -Report $report -Stage $stage
            Update-CardioFirstBuildSummary -Report $report
            Write-CardioFirstBuildReport -Report $report -Path $resolvedReportPath
        }
        catch {
            $stopwatch.Stop()
            $stage.status = "failed"
            $stage.completedAtUtc = Get-CardioFirstBuildUtcTimestamp
            $stage.durationSeconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 3)
            $stage.error = [ordered]@{
                type = $_.Exception.GetType().FullName
                message = $_.Exception.Message
            }
            for ($blockedIndex = $index + 1; $blockedIndex -lt $report.stages.Count; $blockedIndex++) {
                $blockedStage = $report.stages[$blockedIndex]
                if ($blockedStage.enabled) {
                    $blockedStage.status = "blocked"
                    $blockedStage.blockedBy = [string]$definition.Name
                }
            }
            $report.status = "failed"
            $report.completedAtUtc = Get-CardioFirstBuildUtcTimestamp
            $report.error = [ordered]@{
                stage = [string]$definition.Name
                type = $_.Exception.GetType().FullName
                message = $_.Exception.Message
            }
            $report.nextAction = "Resolve the '$($definition.Name)' error in this report, then run resumeCommand as a standard user. No installation or elevation is performed."
            Update-CardioFirstBuildSummary -Report $report
            Write-CardioFirstBuildReport -Report $report -Path $resolvedReportPath
            Write-Host "First-build report: $resolvedReportPath" -ForegroundColor Yellow
            Write-Host "Resume: $resumeCommand" -ForegroundColor Yellow
            throw "First-build stage '$($definition.Name)' failed. Report: $resolvedReportPath. $($_.Exception.Message)"
        }
    }

    Update-CardioFirstBuildSummary -Report $report
    $report.completedAtUtc = Get-CardioFirstBuildUtcTimestamp
    if ($report.package.requested) {
        $report.status = "package-created-walkthrough-not-run"
        $report.nextAction = "Run the exact packaged build through the walkthrough checklist. The walkthrough remains not-evaluated until separate evidence is recorded."
    }
    else {
        $report.status = "baseline-passed-package-not-requested"
        $report.nextAction = "The first-build baseline passed. After committing a clean, reviewed source state, run packageResumeCommand to create a provenance-verified package."
    }
    Write-CardioFirstBuildReport -Report $report -Path $resolvedReportPath
    Write-Host "First-build stage report: $resolvedReportPath" -ForegroundColor Green
    Write-Host $report.nextAction -ForegroundColor Cyan
    return [pscustomobject]$report
}
