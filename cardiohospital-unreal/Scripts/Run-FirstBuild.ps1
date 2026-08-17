[CmdletBinding()]
param(
    [string]$EngineRoot,

    [ValidateRange(1, 2048)]
    [int]$MinimumFreeDiskGB = 100,

    [switch]$IncludePackage,

    [ValidateSet("Development", "Shipping")]
    [string]$Configuration = "Development",

    [string]$ReportPath,

    [string]$ResumeReportPath,

    [switch]$RerunAll
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "FirstBuild-Orchestration.ps1")

$projectRoot = Get-CardioProjectRoot
$runId = "$([DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))-$([Guid]::NewGuid().ToString('N').Substring(0, 8))"
$workstationReportPath = Join-Path $projectRoot "Saved\WorkstationReports\first-build-$runId.json"
$automationReportPath = Join-Path $projectRoot "Saved\AutomationReports\first-build-$runId"
$packageDirectory = Join-Path $projectRoot "PackagedBuilds\Win64-$Configuration-$runId"

$context = [ordered]@{
    projectRoot = $projectRoot
    engineRoot = $EngineRoot
    minimumFreeDiskGB = $MinimumFreeDiskGB
    workstationReportPath = $workstationReportPath
    automationReportPath = $automationReportPath
    packageDirectory = $packageDirectory
    configuration = $Configuration
}
$options = [ordered]@{
    engineRoot = $EngineRoot
    minimumFreeDiskGB = $MinimumFreeDiskGB
    configuration = $Configuration
    includePackage = [bool]$IncludePackage
}

$stageDefinitions = @(
    [pscustomobject]@{
        Name = "preflight"
        DisplayName = "Standard-user workstation preflight"
        Required = $true
        Enabled = $true
        Action = {
            param($State)
            $parameters = @{
                MinimumFreeDiskGB = [int]$State.minimumFreeDiskGB
                ReportPath = [string]$State.workstationReportPath
            }
            if ($State.engineRoot) { $parameters.EngineRoot = [string]$State.engineRoot }
            & (Join-Path $PSScriptRoot "Check-Workstation.ps1") @parameters
        }
        ArtifactProvider = {
            param($State)
            New-CardioFirstBuildArtifact -ProjectRoot $State.projectRoot -Path $State.workstationReportPath -Kind "workstation-report"
        }
    },
    [pscustomobject]@{
        Name = "validation"
        DisplayName = "Portable clinical and script validation"
        Required = $true
        Enabled = $true
        Action = {
            param($State)
            & (Join-Path $PSScriptRoot "Run-Validation.ps1")
        }
        ArtifactProvider = {
            param($State)
            New-CardioFirstBuildArtifact -ProjectRoot $State.projectRoot -Path "Content\Data\clinical-content.json" -Kind "validated-clinical-content"
        }
    },
    [pscustomobject]@{
        Name = "project-generation"
        DisplayName = "Visual Studio project generation"
        Required = $true
        Enabled = $true
        Action = {
            param($State)
            $parameters = @{}
            if ($State.engineRoot) { $parameters.EngineRoot = [string]$State.engineRoot }
            & (Join-Path $PSScriptRoot "Generate-ProjectFiles.ps1") @parameters
        }
        ArtifactProvider = {
            param($State)
            New-CardioFirstBuildArtifact -ProjectRoot $State.projectRoot -Path "CardioHospital.sln" -Kind "visual-studio-solution"
        }
    },
    [pscustomobject]@{
        Name = "editor-build"
        DisplayName = "CardioHospitalEditor Win64 Development build"
        Required = $true
        Enabled = $true
        Action = {
            param($State)
            $parameters = @{}
            if ($State.engineRoot) { $parameters.EngineRoot = [string]$State.engineRoot }
            & (Join-Path $PSScriptRoot "Build-Editor.ps1") @parameters
        }
        ArtifactProvider = {
            param($State)
            New-CardioFirstBuildArtifact -ProjectRoot $State.projectRoot -Path "Binaries\Win64\UnrealEditor-CardioHospital.dll" -Kind "editor-module"
        }
    },
    [pscustomobject]@{
        Name = "automation"
        DisplayName = "CardioHospital Unreal automation"
        Required = $true
        Enabled = $true
        Action = {
            param($State)
            $parameters = @{
                ReportRoot = [string]$State.automationReportPath
            }
            if ($State.engineRoot) { $parameters.EngineRoot = [string]$State.engineRoot }
            & (Join-Path $PSScriptRoot "Run-Automation.ps1") @parameters
        }
        ArtifactProvider = {
            param($State)
            New-CardioFirstBuildArtifact -ProjectRoot $State.projectRoot -Path (Join-Path $State.automationReportPath "index.json") -Kind "automation-report"
        }
    },
    [pscustomobject]@{
        Name = "package"
        DisplayName = "Provenance-verified Windows package"
        Required = $false
        Enabled = [bool]$IncludePackage
        Action = {
            param($State)
            $parameters = @{
                Configuration = [string]$State.configuration
                ArchiveDirectory = [string]$State.packageDirectory
            }
            if ($State.engineRoot) { $parameters.EngineRoot = [string]$State.engineRoot }
            & (Join-Path $PSScriptRoot "Package-Windows.ps1") @parameters
        }
        ArtifactProvider = {
            param($State)
            New-CardioFirstBuildArtifact -ProjectRoot $State.projectRoot -Path (Join-Path $State.packageDirectory "build-manifest.json") -Kind "package-manifest"
        }
    }
)

$result = Invoke-CardioFirstBuildPlan `
    -ProjectRoot $projectRoot `
    -RunId $runId `
    -ReportPath $ReportPath `
    -ResumeReportPath $ResumeReportPath `
    -RerunAll:$RerunAll `
    -StageDefinitions $stageDefinitions `
    -Context $context `
    -Options $options `
    -CommandPath $PSCommandPath

$result | ConvertTo-Json -Depth 20
