[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = Split-Path -Parent $PSScriptRoot
$scriptsRoot = Join-Path $projectRoot "Scripts"
. (Join-Path $scriptsRoot "Unreal-Common.ps1")

$script:assertionCount = 0

function Assert-CardioTrue {
    param(
        [Parameter(Mandatory)]
        [bool]$Condition,

        [Parameter(Mandatory)]
        [string]$Message
    )
    $script:assertionCount++
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

function Assert-CardioEqual {
    param(
        [AllowNull()]
        $Expected,

        [AllowNull()]
        $Actual,

        [Parameter(Mandatory)]
        [string]$Message
    )
    $script:assertionCount++
    if ($Expected -ne $Actual) {
        throw "Assertion failed: $Message. Expected '$Expected', received '$Actual'."
    }
}

function Assert-CardioThrows {
    param(
        [Parameter(Mandatory)]
        [scriptblock]$Action,

        [Parameter(Mandatory)]
        [string]$MessagePattern
    )
    $script:assertionCount++
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

function New-CardioFixtureFile {
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [string]$Content = "fixture"
    )
    $parent = Split-Path -Parent $Path
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function New-CardioPackageFixture {
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter(Mandatory)]
        [string]$PackageId
    )

    $executablePath = Join-Path $Path "Windows\CardioHospital.exe"
    New-CardioFixtureFile -Path $executablePath -Content "packaged-executable-fixture"
    $executableInfo = Get-Item -LiteralPath $executablePath
    $manifest = [ordered]@{
        schemaVersion = 1
        packageId = $PackageId
        generatedAtUtc = [DateTimeOffset]::UtcNow.ToString("o")
        sourceCommit = ("a" * 40)
        sourceState = "clean"
        sourceProjectPath = "cardiohospital-unreal"
        target = "CardioHospital"
        platform = "Win64"
        configuration = "Development"
        engine = [ordered]@{ version = "5.8" }
        toolchain = [ordered]@{
            visualStudioVersion = "18.0.10000.0"
            msvcVersion = "14.50.12345"
            windowsSdkVersion = "10.0.22621.0"
        }
        walkthroughPassed = $false
        walkthrough = [ordered]@{
            packageId = $PackageId
            status = "not-run"
            passed = $false
            requiredResolution = "2560x1440"
            evidence = $null
        }
        files = @(
            [ordered]@{
                path = "Windows/CardioHospital.exe"
                bytes = $executableInfo.Length
                sha256 = (Get-FileHash -LiteralPath $executablePath -Algorithm SHA256).Hash.ToLowerInvariant()
            }
        )
    }
    $manifestJson = $manifest | ConvertTo-Json -Depth 10
    New-CardioFixtureFile -Path (Join-Path $Path "build-manifest.json") -Content "$manifestJson`n"
}

$tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd("\", "/")
$tempRoot = Join-Path $tempBase ("cardio-workstation-tests-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

try {
    foreach ($scriptFile in @(Get-ChildItem -LiteralPath $scriptsRoot -Filter "*.ps1" -File)) {
        $tokens = $null
        $parseErrors = $null
        [System.Management.Automation.Language.Parser]::ParseFile(
            $scriptFile.FullName,
            [ref]$tokens,
            [ref]$parseErrors
        ) | Out-Null
        Assert-CardioEqual -Expected 0 -Actual $parseErrors.Count -Message "$($scriptFile.Name) parses as PowerShell"
    }

    $engineRoot = Join-Path $tempRoot "UE 5.8 Fixture With Spaces"
    New-CardioFixtureFile -Path (Join-Path $engineRoot "Engine\Build\Build.version") -Content '{"MajorVersion":5,"MinorVersion":8,"PatchVersion":0}'
    foreach ($relativePath in @(
        "Engine\Build\BatchFiles\Build.bat",
        "Engine\Build\BatchFiles\GenerateProjectFiles.bat",
        "Engine\Build\BatchFiles\RunUAT.bat",
        "Engine\Binaries\Win64\UnrealEditor.exe",
        "Engine\Binaries\Win64\UnrealEditor-Cmd.exe"
    )) {
        New-CardioFixtureFile -Path (Join-Path $engineRoot $relativePath)
    }

    $engineInspection = Get-CardioEngineInspection -Path $engineRoot
    Assert-CardioTrue -Condition $engineInspection.IsValid -Message "A complete UE 5.8 fixture is accepted"
    Assert-CardioEqual -Expected "5.8" -Actual $engineInspection.Version -Message "UE fixture version is read from Build.version"
    Assert-CardioEqual -Expected ([System.IO.Path]::GetFullPath($engineRoot)) -Actual (Resolve-CardioEngineRoot -EngineRoot $engineRoot) -Message "An explicit engine path with spaces resolves"

    New-CardioFixtureFile -Path (Join-Path $engineRoot "Engine\Build\Build.version") -Content '{"MajorVersion":5,"MinorVersion":7,"PatchVersion":0}'
    Assert-CardioThrows -Action { Resolve-CardioEngineRoot -EngineRoot $engineRoot } -MessagePattern "requires 5\.8"
    New-CardioFixtureFile -Path (Join-Path $engineRoot "Engine\Build\Build.version") -Content '{"MajorVersion":5,"MinorVersion":8,"PatchVersion":0}'

    Assert-CardioTrue -Condition (Test-CardioSupportedGpuName "NVIDIA GeForce RTX 4080") -Message "RTX 4080 is accepted"
    Assert-CardioTrue -Condition (Test-CardioSupportedGpuName "NVIDIA GeForce RTX 4090") -Message "RTX 4090 is accepted"
    Assert-CardioTrue -Condition (Test-CardioSupportedGpuName "NVIDIA GeForce RTX 5080 SUPER") -Message "RTX 5080-class is accepted"
    Assert-CardioTrue -Condition (Test-CardioSupportedGpuName "NVIDIA GeForce RTX 5090") -Message "RTX 5090 is accepted"
    Assert-CardioTrue -Condition (-not (Test-CardioSupportedGpuName "NVIDIA GeForce RTX 4070 Ti")) -Message "RTX 4070 Ti is rejected"
    Assert-CardioTrue -Condition (-not (Test-CardioSupportedGpuName "NVIDIA GeForce RTX 4090 Laptop GPU")) -Message "A laptop 4090 is not treated as desktop 4080-class"
    Assert-CardioTrue -Condition (-not (Test-CardioSupportedGpuName "AMD Radeon RX 7900 XTX")) -Message "A non-NVIDIA adapter is rejected"

    $sdkRoot = Join-Path $tempRoot "Windows Kits\10"
    $sdkVersion = "10.0.22621.0"
    foreach ($relativePath in @(
        "Include\$sdkVersion\um\Windows.h",
        "Include\$sdkVersion\shared\sdkddkver.h",
        "bin\$sdkVersion\x64\rc.exe",
        "Lib\$sdkVersion\um\x64\User32.Lib"
    )) {
        New-CardioFixtureFile -Path (Join-Path $sdkRoot $relativePath)
    }
    $sdkInfo = Get-CardioWindowsSdkInfo -SearchRoots @($sdkRoot)
    Assert-CardioTrue -Condition $sdkInfo.Found -Message "A complete Windows SDK fixture is found"
    Assert-CardioTrue -Condition $sdkInfo.MeetsMinimumVersion -Message "Windows SDK 10.0.22621 meets the UE 5.8 minimum"

    $vsRoot = Join-Path $tempRoot "Visual Studio 2026 Fixture"
    New-CardioFixtureFile -Path (Join-Path $vsRoot "VC\Tools\MSVC\14.50.12345\bin\Hostx64\x64\cl.exe")
    $vsWhere = Join-Path $tempRoot "vswhere-fixture.cmd"
    $vsPathForJson = $vsRoot.Replace("\", "/")
    New-CardioFixtureFile -Path $vsWhere -Content "@echo off`r`necho [{^`"installationPath^`":^`"$vsPathForJson^`",^`"installationVersion^`":^`"18.0.10000.0^`"}]`r`n"
    $vsInfo = Get-CardioVisualStudioInfo -VsWherePath $vsWhere
    Assert-CardioTrue -Condition $vsInfo.Found -Message "A vswhere-discovered Visual Studio fixture is found"
    Assert-CardioTrue -Condition $vsInfo.MeetsMinimumVersion -Message "Visual Studio 2026 is accepted for UE 5.8"
    Assert-CardioTrue -Condition $vsInfo.HasGameCppWorkload -Message "The NativeGame workload query is honored"
    Assert-CardioTrue -Condition $vsInfo.MeetsMinimumMsvc -Message "MSVC 14.50 meets the UE 5.8 minimum"

    $emptyOutput = Join-Path $tempRoot "Empty Output"
    $initializedOutput = Initialize-CardioOutputDirectory -Path $emptyOutput -Purpose "Fixture"
    Assert-CardioTrue -Condition (Test-Path -LiteralPath $initializedOutput -PathType Container) -Message "A new output directory is created"
    New-CardioFixtureFile -Path (Join-Path $initializedOutput "stale.txt")
    Assert-CardioThrows -Action { Initialize-CardioOutputDirectory -Path $initializedOutput -Purpose "Fixture" } -MessagePattern "not empty"

    $automationScript = Get-Content -Raw -LiteralPath (Join-Path $scriptsRoot "Run-Automation.ps1")
    Assert-CardioTrue -Condition ($automationScript -match 'Automation RunTest CardioHospital') -Message "Automation uses Epic's singular RunTest command"
    Assert-CardioTrue -Condition ($automationScript -notmatch 'Automation RunTests CardioHospital') -Message "The obsolete plural RunTests command is absent"

    $packageScript = Get-Content -Raw -LiteralPath (Join-Path $scriptsRoot "Package-Windows.ps1")
    Assert-CardioTrue -Condition ($packageScript -match 'Get-CardioGitProvenance') -Message "Packaging requires Git provenance"
    Assert-CardioTrue -Condition ($packageScript -match 'walkthroughPassed\s*=\s*\$false') -Message "Packaging never claims the walkthrough passed"
    Assert-CardioTrue -Condition ($packageScript -match 'status\s*=\s*"not-run"') -Message "The walkthrough evidence starts as not-run"

    $checkScript = Get-Content -Raw -LiteralPath (Join-Path $scriptsRoot "Check-Workstation.ps1")
    Assert-CardioTrue -Condition ($checkScript -match 'Microsoft\.VisualStudio\.Workload\.NativeGame') -Message "Preflight checks the Game development with C++ workload"
    Assert-CardioTrue -Condition ($checkScript -match '10\.0\.22621\.0') -Message "Preflight enforces the UE 5.8 SDK minimum"
    Assert-CardioTrue -Condition ($checkScript -match 'RequiresElevationToRun\s*=\s*\$false') -Message "The preflight explicitly remains standard-user safe"

    $workstationReportPath = Join-Path $tempRoot "workstation-report.json"
    $workstationReport = [ordered]@{
        SchemaVersion = 2
        GeneratedAtUtc = [DateTimeOffset]::UtcNow.ToString("o")
        Passed = $true
        Windows = [ordered]@{ BuildNumber = 26100 }
        Memory = [ordered]@{ InstalledGB = 64 }
        GPU = [ordered]@{ Selected = "NVIDIA GeForce RTX 4080"; DriverVersion = "fixture" }
        Unreal = [ordered]@{ Version = "5.8" }
        VisualStudio = [ordered]@{ Version = "18.0.10000.0"; MsvcVersion = "14.50.12345" }
        WindowsSdk = [ordered]@{ Version = "10.0.22621.0" }
    }
    New-CardioFixtureFile -Path $workstationReportPath -Content "$(($workstationReport | ConvertTo-Json -Depth 6))`n"
    $evidenceScript = Join-Path $scriptsRoot "Record-WalkthroughEvidence.ps1"

    $failedPackage = Join-Path $tempRoot "Failed Package Fixture"
    New-CardioPackageFixture -Path $failedPackage -PackageId "fixture-failed-package"
    & $evidenceScript `
        -PackageDirectory $failedPackage `
        -WorkstationReportPath $workstationReportPath `
        -Outcome Failed `
        -ConfirmExactPackageRun `
        -PassedAcceptanceStep @(1, 2, 3) `
        -Notes "Fixture failure at acceptance step 4." 6>$null
    $failedManifest = Get-Content -Raw -LiteralPath (Join-Path $failedPackage "build-manifest.json") | ConvertFrom-Json
    Assert-CardioTrue -Condition (-not [bool]$failedManifest.walkthroughPassed) -Message "Failed evidence never marks walkthroughPassed true"
    Assert-CardioEqual -Expected "failed" -Actual $failedManifest.walkthrough.status -Message "Failed evidence records failed status"
    Assert-CardioEqual -Expected 1 -Actual @($failedManifest.walkthrough.evidence).Count -Message "Failed evidence is tied into the package manifest"

    $passingPackage = Join-Path $tempRoot "Passing Package Fixture"
    New-CardioPackageFixture -Path $passingPackage -PackageId "fixture-passing-package"
    $performanceArtifact = Join-Path $tempRoot "performance-capture.csv"
    New-CardioFixtureFile -Path $performanceArtifact -Content "frame,fps,frame_ms`n1,60.5,16.6`n"
    & $evidenceScript `
        -PackageDirectory $passingPackage `
        -WorkstationReportPath $workstationReportPath `
        -Outcome Passed `
        -ConfirmExactPackageRun `
        -ConfirmStudioDriver `
        -EvidenceArtifactPath $performanceArtifact `
        -PassedAcceptanceStep (1..19) `
        -AverageFps 60.5 `
        -MinimumFps 55 `
        -FrameTimeP95Ms 16.6 `
        -DrawCalls 1200 `
        -Triangles 2500000 `
        -GpuMemoryMB 8500 `
        -TextureMemoryMB 3200 `
        -NpcCount 3 `
        -StartupSeconds 8.2 6>$null
    $passingManifest = Get-Content -Raw -LiteralPath (Join-Path $passingPackage "build-manifest.json") | ConvertFrom-Json
    Assert-CardioTrue -Condition ([bool]$passingManifest.walkthroughPassed) -Message "Only complete passing evidence marks walkthroughPassed true"
    Assert-CardioEqual -Expected "passed" -Actual $passingManifest.walkthrough.status -Message "Passing evidence records passed status"
    Assert-CardioEqual -Expected 3 -Actual @($passingManifest.files).Count -Message "Evidence JSON and its performance capture are added to the package inventory"

    $tamperedPackage = Join-Path $tempRoot "Tampered Package Fixture"
    New-CardioPackageFixture -Path $tamperedPackage -PackageId "fixture-tampered-package"
    New-CardioFixtureFile -Path (Join-Path $tamperedPackage "Windows\CardioHospital.exe") -Content "tampered"
    Assert-CardioThrows -Action {
        & $evidenceScript `
            -PackageDirectory $tamperedPackage `
            -WorkstationReportPath $workstationReportPath `
            -Outcome Failed `
            -ConfirmExactPackageRun `
            -Notes "Expected integrity rejection."
    } -MessagePattern "size changed|hash changed"

    Write-Host "$script:assertionCount workstation/build-script assertions passed." -ForegroundColor Green
}
finally {
    $resolvedTempRoot = [System.IO.Path]::GetFullPath($tempRoot).TrimEnd("\", "/")
    if ($resolvedTempRoot.StartsWith("$tempBase$([System.IO.Path]::DirectorySeparatorChar)", [System.StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $resolvedTempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
