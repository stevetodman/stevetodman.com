[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = Split-Path -Parent $PSScriptRoot
$scriptsRoot = Join-Path $projectRoot "Scripts"
. (Join-Path $scriptsRoot "FirstBuild-Orchestration.ps1")

$script:firstBuildAssertionCount = 0

function Assert-FirstBuildTrue {
    param(
        [Parameter(Mandatory)]
        [bool]$Condition,

        [Parameter(Mandatory)]
        [string]$Message
    )
    $script:firstBuildAssertionCount++
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

function Assert-FirstBuildEqual {
    param(
        [AllowNull()]
        $Expected,

        [AllowNull()]
        $Actual,

        [Parameter(Mandatory)]
        [string]$Message
    )
    $script:firstBuildAssertionCount++
    if ($Expected -ne $Actual) {
        throw "Assertion failed: $Message. Expected '$Expected', received '$Actual'."
    }
}

function Assert-FirstBuildThrows {
    param(
        [Parameter(Mandatory)]
        [scriptblock]$Action,

        [Parameter(Mandatory)]
        [string]$MessagePattern
    )
    $script:firstBuildAssertionCount++
    try {
        & $Action
    }
    catch {
        if ($_.Exception.Message -notmatch $MessagePattern) {
            throw "Expected an error matching '$MessagePattern', received: $($_.Exception.Message)"
        }
        return
    }
    throw "Expected an error matching '$MessagePattern', but no error was thrown."
}

function Write-FirstBuildFixtureFile {
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [string]$Content = "fixture"
    )

    $parent = Split-Path -Parent $Path
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Get-FirstBuildFixtureFingerprint {
    param([string]$Root)
    return (Get-FileHash -LiteralPath (Join-Path $Root "Source\fixture.txt") -Algorithm SHA256).Hash.ToLowerInvariant()
}

function New-FirstBuildFixtureStageDefinitions {
    param(
        [Parameter(Mandatory)]
        [bool]$IncludePackage
    )

    $definitions = [System.Collections.Generic.List[object]]::new()
    foreach ($stageName in @("preflight", "validation", "project-generation", "editor-build", "automation", "package")) {
        $nameForAction = $stageName
        $enabled = ($stageName -ne "package" -or $IncludePackage)
        $required = ($stageName -ne "package")
        $action = {
            param($State)
            $name = $nameForAction
            $State.counters[$name] = [int]$State.counters[$name] + 1
            if ($State.failStage -eq $name) { throw "fixture failure at $name" }
            if ($State.mutateSourceStage -eq $name) {
                $sourcePath = Join-Path $State.projectRoot "Source\fixture.txt"
                [System.IO.File]::WriteAllText(
                    $sourcePath,
                    "source-mutated-during-$name",
                    [System.Text.UTF8Encoding]::new($false))
            }
            $payload = if ($name -eq "package") {
                [ordered]@{
                    configuration = [string]$State.configuration
                    walkthroughPassed = $false
                    walkthrough = [ordered]@{ status = "not-run"; passed = $false }
                } | ConvertTo-Json -Compress
            }
            else {
                "fixture-$name-$($State.counters[$name])"
            }
            $artifactPath = [string]$State.artifactPaths[$name]
            $artifactParent = Split-Path -Parent $artifactPath
            New-Item -ItemType Directory -Path $artifactParent -Force | Out-Null
            [System.IO.File]::WriteAllText(
                $artifactPath,
                $payload,
                [System.Text.UTF8Encoding]::new($false))
        }.GetNewClosure()
        $artifactProvider = {
            param($State)
            $name = $nameForAction
            $kind = if ($name -eq "package") { "package-manifest" } else { "$name-evidence" }
            $projectPath = [System.IO.Path]::GetFullPath([string]$State.projectRoot).TrimEnd("\", "/")
            $artifactPath = [System.IO.Path]::GetFullPath([string]$State.artifactPaths[$name])
            $projectBoundary = "$projectPath$([System.IO.Path]::DirectorySeparatorChar)"
            if (-not $artifactPath.StartsWith($projectBoundary, [System.StringComparison]::OrdinalIgnoreCase)) {
                throw "Fixture artifact escaped the project boundary: $artifactPath"
            }
            $file = Get-Item -LiteralPath $artifactPath -Force -ErrorAction Stop
            [ordered]@{
                kind = $kind
                path = $artifactPath.Substring($projectBoundary.Length).Replace("\", "/")
                bytes = [long]$file.Length
                sha256 = (Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256).Hash.ToLowerInvariant()
            }
        }.GetNewClosure()
        $definitions.Add([pscustomobject]@{
            Name = $stageName
            DisplayName = "Fixture $stageName"
            Required = $required
            Enabled = $enabled
            Action = $action
            ArtifactProvider = $artifactProvider
        })
    }
    return @($definitions)
}

function Read-FirstBuildFixtureReport {
    param([string]$Path)
    return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Get-FirstBuildFixtureStage {
    param(
        [Parameter(Mandatory)]
        $Report,

        [Parameter(Mandatory)]
        [string]$Name
    )
    return $Report.stages | Where-Object { $_.name -eq $Name } | Select-Object -First 1
}

$tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd("\", "/")
$tempRoot = Join-Path $tempBase ("cardio-first-build-tests-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

try {
    Write-FirstBuildFixtureFile -Path (Join-Path $tempRoot "Source\fixture.txt") -Content "source-v1"
    $workstationFingerprintPath = Join-Path $tempRoot "Saved\FixtureArtifacts\workstation-fingerprint.json"
    $workstationFingerprintFixture = [ordered]@{
        Passed = $true
        Windows = [ordered]@{ BuildNumber = "26100" }
        Memory = [ordered]@{ InstalledGB = 64 }
        GPU = [ordered]@{ Selected = "NVIDIA GeForce RTX 4080"; DriverVersion = "fixture-driver-1" }
        Unreal = [ordered]@{ Version = "5.8"; Root = "C:\Fixture UE 5.8" }
        VisualStudio = [ordered]@{ Version = "18.0.10000.0"; InstallationPath = "C:\Fixture VS"; MsvcVersion = "14.50.12345" }
        WindowsSdk = [ordered]@{ Version = "10.0.22621.0"; Root = "C:\Fixture SDK" }
        Node = [ordered]@{ Version = "v24.0.0"; Path = "C:\Fixture Node\node.exe" }
    }
    Write-FirstBuildFixtureFile -Path $workstationFingerprintPath -Content ($workstationFingerprintFixture | ConvertTo-Json -Depth 8)
    $workstationFingerprint1 = Get-CardioFirstBuildEnvironmentFingerprint -WorkstationReportPath $workstationFingerprintPath
    $workstationFingerprint2 = Get-CardioFirstBuildEnvironmentFingerprint -WorkstationReportPath $workstationFingerprintPath
    Assert-FirstBuildEqual -Expected $workstationFingerprint1 -Actual $workstationFingerprint2 -Message "Equivalent workstation inventory has a deterministic fingerprint"
    $workstationFingerprintFixture.GPU.DriverVersion = "fixture-driver-2"
    Write-FirstBuildFixtureFile -Path $workstationFingerprintPath -Content ($workstationFingerprintFixture | ConvertTo-Json -Depth 8)
    $workstationFingerprint3 = Get-CardioFirstBuildEnvironmentFingerprint -WorkstationReportPath $workstationFingerprintPath
    Assert-FirstBuildTrue -Condition ($workstationFingerprint1 -ne $workstationFingerprint3) -Message "A changed GPU driver invalidates the environment fingerprint"

    $artifactRoot = Join-Path $tempRoot "Saved\FixtureArtifacts"
    $artifactPaths = [ordered]@{
        preflight = Join-Path $artifactRoot "preflight.json"
        validation = Join-Path $artifactRoot "validation.json"
        "project-generation" = Join-Path $artifactRoot "project-generation.sln"
        "editor-build" = Join-Path $artifactRoot "editor-build.dll"
        automation = Join-Path $artifactRoot "automation.json"
        package = Join-Path $tempRoot "PackagedBuilds\fixture\build-manifest.json"
    }
    $counters = @{
        preflight = 0
        validation = 0
        "project-generation" = 0
        "editor-build" = 0
        automation = 0
        package = 0
    }
    $context = [ordered]@{
        projectRoot = $tempRoot
        workstationReportPath = $artifactPaths.preflight
        automationReportPath = Split-Path -Parent $artifactPaths.automation
        packageDirectory = Split-Path -Parent $artifactPaths.package
        artifactPaths = $artifactPaths
        counters = $counters
        failStage = "automation"
        mutateSourceStage = $null
        environmentFingerprint = "fixture-environment-v1"
    }
    $baseOptions = [ordered]@{
        engineRoot = "C:\Fixture UE 5.8"
        minimumFreeDiskGB = 100
        configuration = "Development"
        includePackage = $false
    }
    $commandPath = Join-Path $scriptsRoot "Run-FirstBuild.ps1"
    $fingerprintProvider = { param($Root) Get-FirstBuildFixtureFingerprint -Root $Root }
    $environmentFingerprintProvider = { param($State) [string]$State.environmentFingerprint }

    $report1Path = Join-Path $tempRoot "Saved\FirstBuildReports\run-1.json"
    Assert-FirstBuildThrows -Action {
        Invoke-CardioFirstBuildPlan `
            -ProjectRoot $tempRoot `
            -RunId "fixture-run-1" `
            -ReportPath $report1Path `
            -StageDefinitions (New-FirstBuildFixtureStageDefinitions -IncludePackage $false) `
            -Context $context `
            -Options $baseOptions `
            -CommandPath $commandPath `
            -FingerprintProvider $fingerprintProvider `
            -EnvironmentFingerprintProvider $environmentFingerprintProvider
    } -MessagePattern "stage 'automation' failed"
    $report1 = Read-FirstBuildFixtureReport -Path $report1Path
    Assert-FirstBuildEqual -Expected "failed" -Actual $report1.status -Message "A failed stage makes the run fail"
    Assert-FirstBuildEqual -Expected "passed" -Actual (Get-FirstBuildFixtureStage -Report $report1 -Name "editor-build").status -Message "Earlier completed stages remain passed"
    Assert-FirstBuildEqual -Expected "failed" -Actual (Get-FirstBuildFixtureStage -Report $report1 -Name "automation").status -Message "The failing stage is explicit"
    Assert-FirstBuildEqual -Expected "not-requested" -Actual (Get-FirstBuildFixtureStage -Report $report1 -Name "package").status -Message "An optional unrequested package is not called passed or blocked"
    Assert-FirstBuildTrue -Condition (-not [bool]$report1.baseline.passed) -Message "A failed automation stage does not pass the baseline"
    Assert-FirstBuildTrue -Condition (-not [bool]$report1.walkthrough.passed) -Message "A build report never infers walkthrough success"
    Assert-FirstBuildTrue -Condition ([bool]($report1.resumeCommand -match "ResumeReportPath")) -Message "A failure records a pasteable resume command"

    $context.failStage = $null
    $report2Path = Join-Path $tempRoot "Saved\FirstBuildReports\run-2.json"
    Invoke-CardioFirstBuildPlan `
        -ProjectRoot $tempRoot `
        -RunId "fixture-run-2" `
        -ReportPath $report2Path `
        -ResumeReportPath $report1Path `
        -StageDefinitions (New-FirstBuildFixtureStageDefinitions -IncludePackage $false) `
        -Context $context `
        -Options $baseOptions `
        -CommandPath $commandPath `
        -FingerprintProvider $fingerprintProvider `
        -EnvironmentFingerprintProvider $environmentFingerprintProvider | Out-Null
    $report2 = Read-FirstBuildFixtureReport -Path $report2Path
    Assert-FirstBuildEqual -Expected 2 -Actual $counters.preflight -Message "Preflight always reruns during resume"
    Assert-FirstBuildEqual -Expected 1 -Actual $counters.validation -Message "A verified validation artifact is reused"
    Assert-FirstBuildEqual -Expected "reused" -Actual (Get-FirstBuildFixtureStage -Report $report2 -Name "validation").status -Message "Reuse is explicit rather than reported as passed"
    Assert-FirstBuildEqual -Expected "passed" -Actual (Get-FirstBuildFixtureStage -Report $report2 -Name "automation").status -Message "The formerly failed stage reruns"
    Assert-FirstBuildEqual -Expected "baseline-passed-package-not-requested" -Actual $report2.status -Message "Baseline success does not imply packaging"
    Assert-FirstBuildTrue -Condition ([bool]$report2.baseline.passed) -Message "The full through-automation baseline passes"
    Assert-FirstBuildEqual -Expected "not-evaluated" -Actual $report2.walkthrough.status -Message "The walkthrough remains a separate gate"

    Write-FirstBuildFixtureFile -Path (Join-Path $tempRoot "Source\fixture.txt") -Content "source-v2"
    $report3Path = Join-Path $tempRoot "Saved\FirstBuildReports\run-3.json"
    Invoke-CardioFirstBuildPlan `
        -ProjectRoot $tempRoot `
        -RunId "fixture-run-3" `
        -ReportPath $report3Path `
        -ResumeReportPath $report2Path `
        -StageDefinitions (New-FirstBuildFixtureStageDefinitions -IncludePackage $false) `
        -Context $context `
        -Options $baseOptions `
        -CommandPath $commandPath `
        -FingerprintProvider $fingerprintProvider `
        -EnvironmentFingerprintProvider $environmentFingerprintProvider | Out-Null
    $report3 = Read-FirstBuildFixtureReport -Path $report3Path
    Assert-FirstBuildEqual -Expected "passed" -Actual (Get-FirstBuildFixtureStage -Report $report3 -Name "validation").status -Message "A source change forces validation to rerun"
    Assert-FirstBuildEqual -Expected "passed" -Actual (Get-FirstBuildFixtureStage -Report $report3 -Name "editor-build").status -Message "All downstream stages rerun after a source change"
    Assert-FirstBuildEqual -Expected 2 -Actual $counters.validation -Message "Source mismatch increments the validation execution count"

    $packageOptions = [ordered]@{
        engineRoot = $baseOptions.engineRoot
        minimumFreeDiskGB = $baseOptions.minimumFreeDiskGB
        configuration = $baseOptions.configuration
        includePackage = $true
    }
    $report4Path = Join-Path $tempRoot "Saved\FirstBuildReports\run-4.json"
    Invoke-CardioFirstBuildPlan `
        -ProjectRoot $tempRoot `
        -RunId "fixture-run-4" `
        -ReportPath $report4Path `
        -ResumeReportPath $report3Path `
        -StageDefinitions (New-FirstBuildFixtureStageDefinitions -IncludePackage $true) `
        -Context $context `
        -Options $packageOptions `
        -CommandPath $commandPath `
        -FingerprintProvider $fingerprintProvider `
        -EnvironmentFingerprintProvider $environmentFingerprintProvider | Out-Null
    $report4 = Read-FirstBuildFixtureReport -Path $report4Path
    Assert-FirstBuildEqual -Expected "reused" -Actual (Get-FirstBuildFixtureStage -Report $report4 -Name "automation").status -Message "A package-only resume reuses verified baseline evidence"
    Assert-FirstBuildEqual -Expected "passed" -Actual (Get-FirstBuildFixtureStage -Report $report4 -Name "package").status -Message "The newly requested package stage executes"
    Assert-FirstBuildEqual -Expected "created" -Actual $report4.package.status -Message "The package result is distinguished from the walkthrough"
    Assert-FirstBuildEqual -Expected "package-created-walkthrough-not-run" -Actual $report4.status -Message "Overall status does not claim walkthrough success"
    Assert-FirstBuildTrue -Condition (-not [bool]$report4.walkthrough.passed) -Message "Packaging cannot mark the walkthrough passed"
    Assert-FirstBuildTrue -Condition ([bool]($report4.packageResumeCommand -match "IncludePackage")) -Message "The report records a package resume command"

    $shippingOptions = [ordered]@{
        engineRoot = $baseOptions.engineRoot
        minimumFreeDiskGB = $baseOptions.minimumFreeDiskGB
        configuration = "Shipping"
        includePackage = $true
    }
    $context.configuration = "Shipping"
    $packageCountBeforeShipping = [int]$counters.package
    $shippingReportPath = Join-Path $tempRoot "Saved\FirstBuildReports\run-4-shipping.json"
    Invoke-CardioFirstBuildPlan `
        -ProjectRoot $tempRoot `
        -RunId "fixture-run-4-shipping" `
        -ReportPath $shippingReportPath `
        -ResumeReportPath $report4Path `
        -StageDefinitions (New-FirstBuildFixtureStageDefinitions -IncludePackage $true) `
        -Context $context `
        -Options $shippingOptions `
        -CommandPath $commandPath `
        -FingerprintProvider $fingerprintProvider `
        -EnvironmentFingerprintProvider $environmentFingerprintProvider | Out-Null
    $shippingReport = Read-FirstBuildFixtureReport -Path $shippingReportPath
    Assert-FirstBuildEqual -Expected "reused" -Actual (Get-FirstBuildFixtureStage -Report $shippingReport -Name "automation").status -Message "A configuration change may retain the configuration-independent verified baseline"
    Assert-FirstBuildEqual -Expected "passed" -Actual (Get-FirstBuildFixtureStage -Report $shippingReport -Name "package").status -Message "A Shipping request never reuses a Development package"
    Assert-FirstBuildEqual -Expected ($packageCountBeforeShipping + 1) -Actual $counters.package -Message "Changing configuration executes the package stage"
    Assert-FirstBuildTrue -Condition (-not [bool]$shippingReport.resume.optionCompatibility.configurationMatches) -Message "The report discloses the configuration mismatch"
    Assert-FirstBuildTrue -Condition (-not [bool]$shippingReport.resume.optionCompatibility.packageReuseAllowed) -Message "The report records that package reuse was disallowed"
    $shippingManifest = Get-Content -Raw -LiteralPath ([string]$artifactPaths.package) | ConvertFrom-Json
    Assert-FirstBuildEqual -Expected "Shipping" -Actual $shippingManifest.configuration -Message "The rebuilt package evidence matches the requested configuration"
    $context.configuration = "Development"

    Write-FirstBuildFixtureFile -Path ([string]$artifactPaths.validation) -Content "tampered-evidence"
    $report5Path = Join-Path $tempRoot "Saved\FirstBuildReports\run-5.json"
    Invoke-CardioFirstBuildPlan `
        -ProjectRoot $tempRoot `
        -RunId "fixture-run-5" `
        -ReportPath $report5Path `
        -ResumeReportPath $report4Path `
        -StageDefinitions (New-FirstBuildFixtureStageDefinitions -IncludePackage $false) `
        -Context $context `
        -Options $baseOptions `
        -CommandPath $commandPath `
        -FingerprintProvider $fingerprintProvider `
        -EnvironmentFingerprintProvider $environmentFingerprintProvider | Out-Null
    $report5 = Read-FirstBuildFixtureReport -Path $report5Path
    Assert-FirstBuildEqual -Expected "passed" -Actual (Get-FirstBuildFixtureStage -Report $report5 -Name "validation").status -Message "Tampered evidence prevents stage reuse"
    Assert-FirstBuildEqual -Expected 3 -Actual $counters.validation -Message "Tampered evidence causes validation to execute"
    Assert-FirstBuildEqual -Expected "passed" -Actual (Get-FirstBuildFixtureStage -Report $report5 -Name "automation").status -Message "Tampering forces all downstream stages to execute"

    $context.failStage = "validation"
    $report6Path = Join-Path $tempRoot "Saved\FirstBuildReports\run-6.json"
    Assert-FirstBuildThrows -Action {
        Invoke-CardioFirstBuildPlan `
            -ProjectRoot $tempRoot `
            -RunId "fixture-run-6" `
            -ReportPath $report6Path `
            -StageDefinitions (New-FirstBuildFixtureStageDefinitions -IncludePackage $true) `
            -Context $context `
            -Options $packageOptions `
            -CommandPath $commandPath `
            -FingerprintProvider $fingerprintProvider `
            -EnvironmentFingerprintProvider $environmentFingerprintProvider
    } -MessagePattern "stage 'validation' failed"
    $report6 = Read-FirstBuildFixtureReport -Path $report6Path
    Assert-FirstBuildEqual -Expected "blocked" -Actual (Get-FirstBuildFixtureStage -Report $report6 -Name "project-generation").status -Message "Required downstream stages are blocked after failure"
    Assert-FirstBuildEqual -Expected "blocked" -Actual (Get-FirstBuildFixtureStage -Report $report6 -Name "package").status -Message "A requested package is blocked rather than passed"
    Assert-FirstBuildEqual -Expected "blocked" -Actual $report6.package.status -Message "Package summary preserves the blocked state"
    $context.failStage = $null

    $validationCountBeforeEnvironmentChange = [int]$counters.validation
    $context.environmentFingerprint = "fixture-environment-v2"
    $report7Path = Join-Path $tempRoot "Saved\FirstBuildReports\run-7.json"
    Invoke-CardioFirstBuildPlan `
        -ProjectRoot $tempRoot `
        -RunId "fixture-run-7" `
        -ReportPath $report7Path `
        -ResumeReportPath $report5Path `
        -StageDefinitions (New-FirstBuildFixtureStageDefinitions -IncludePackage $false) `
        -Context $context `
        -Options $baseOptions `
        -CommandPath $commandPath `
        -FingerprintProvider $fingerprintProvider `
        -EnvironmentFingerprintProvider $environmentFingerprintProvider | Out-Null
    $report7 = Read-FirstBuildFixtureReport -Path $report7Path
    Assert-FirstBuildEqual -Expected "passed" -Actual (Get-FirstBuildFixtureStage -Report $report7 -Name "validation").status -Message "An environment change prevents compiled-stage reuse"
    Assert-FirstBuildEqual -Expected ($validationCountBeforeEnvironmentChange + 1) -Actual $counters.validation -Message "An environment mismatch reruns validation and downstream stages"

    $context.mutateSourceStage = "project-generation"
    $report8Path = Join-Path $tempRoot "Saved\FirstBuildReports\run-8.json"
    Assert-FirstBuildThrows -Action {
        Invoke-CardioFirstBuildPlan `
            -ProjectRoot $tempRoot `
            -RunId "fixture-run-8" `
            -ReportPath $report8Path `
            -StageDefinitions (New-FirstBuildFixtureStageDefinitions -IncludePackage $false) `
            -Context $context `
            -Options $baseOptions `
            -CommandPath $commandPath `
            -FingerprintProvider $fingerprintProvider `
            -EnvironmentFingerprintProvider $environmentFingerprintProvider
    } -MessagePattern "source changed while 'project-generation'"
    $report8 = Read-FirstBuildFixtureReport -Path $report8Path
    Assert-FirstBuildEqual -Expected "failed" -Actual (Get-FirstBuildFixtureStage -Report $report8 -Name "project-generation").status -Message "Unexpected concurrent source mutation fails the active stage"
    Assert-FirstBuildTrue -Condition ([bool](Get-FirstBuildFixtureStage -Report $report8 -Name "project-generation").sourceChangedDuringStage) -Message "The report records source mutation during the stage"
    Assert-FirstBuildEqual -Expected "blocked" -Actual (Get-FirstBuildFixtureStage -Report $report8 -Name "automation").status -Message "Automation cannot run after concurrent source mutation"
    $context.mutateSourceStage = $null

    Assert-FirstBuildThrows -Action {
        Resolve-CardioFirstBuildReportPath -ProjectRoot $tempRoot -ReportPath $report5Path -RunId "duplicate"
    } -MessagePattern "already exists"

    $outsideProjectPath = Join-Path $tempBase ("outside-first-build-" + [Guid]::NewGuid().ToString("N") + ".txt")
    Write-FirstBuildFixtureFile -Path $outsideProjectPath
    try {
        Assert-FirstBuildThrows -Action {
            New-CardioFirstBuildArtifact -ProjectRoot $tempRoot -Path $outsideProjectPath -Kind "unsafe"
        } -MessagePattern "inside the Unreal project boundary"
    }
    finally {
        Remove-Item -LiteralPath $outsideProjectPath -Force -ErrorAction SilentlyContinue
    }

    Write-Host "$script:firstBuildAssertionCount first-build orchestration assertions passed." -ForegroundColor Green
}
finally {
    $resolvedTempRoot = [System.IO.Path]::GetFullPath($tempRoot).TrimEnd("\", "/")
    if ($resolvedTempRoot.StartsWith("$tempBase$([System.IO.Path]::DirectorySeparatorChar)", [System.StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $resolvedTempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
