[CmdletBinding()]
param(
    [string]$EngineRoot,

    [ValidateRange(20, 1000)]
    [int]$MinimumFreeDiskGB = 100,

    [switch]$SkipDiskCheck,

    [string]$ReportPath
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "Unreal-Common.ps1")

$script:readinessIssues = [System.Collections.Generic.List[object]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()
$itRecommendations = [System.Collections.Generic.List[string]]::new()

function Add-CardioReadinessIssue {
    param(
        [Parameter(Mandatory)]
        [ValidateSet("UserAction", "ITOrAdminRequired")]
        [string]$Category,

        [Parameter(Mandatory)]
        [string]$Code,

        [Parameter(Mandatory)]
        [string]$Message
    )

    $script:readinessIssues.Add([pscustomobject]@{
        category = $Category
        code = $Code
        message = $Message
    })
}

# All inventory operations below are read-only. The check never installs software,
# changes policy, requests elevation, or writes outside an explicitly requested
# report path.
$os = $null
try {
    $os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
}
catch {
    Write-Verbose "Win32_OperatingSystem was unavailable; using non-admin fallbacks."
}

$osBuildNumber = [Environment]::OSVersion.Version.Build
$osCaption = $null
try {
    $osCaption = Get-ItemPropertyValue -LiteralPath "Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion" -Name ProductName -ErrorAction Stop
}
catch {
    if ($os) { $osCaption = [string]$os.Caption }
}
if ($os -and [int]$os.BuildNumber -gt 0) { $osBuildNumber = [int]$os.BuildNumber }
$isClientWindows = [bool](-not $os -or [int]$os.ProductType -eq 1)
$isWindows11 = [bool]($isClientWindows -and $osBuildNumber -ge 22000)
if (-not $isWindows11) {
    Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "windows-11-required" -Message "Windows 11 is required; detected '$osCaption' build $osBuildNumber. An operating-system upgrade requires IT/admin action on a managed work PC."
}

$installedMemoryBytes = [double]0
$memorySource = "Unavailable"
try {
    $memoryModules = @(Get-CimInstance Win32_PhysicalMemory -ErrorAction Stop)
    if ($memoryModules.Count -gt 0) {
        $memorySum = ($memoryModules | Measure-Object -Property Capacity -Sum).Sum
        if ($null -ne $memorySum) {
            $installedMemoryBytes = [double]$memorySum
            $memorySource = "PhysicalModules"
        }
    }
}
catch {
    Write-Verbose "Win32_PhysicalMemory was unavailable; using a non-admin .NET fallback."
}
if ($installedMemoryBytes -le 0) {
    try {
        Add-Type -AssemblyName Microsoft.VisualBasic -ErrorAction Stop
        $installedMemoryBytes = [double]([Microsoft.VisualBasic.Devices.ComputerInfo]::new().TotalPhysicalMemory)
        $memorySource = "UsableMemoryFallback"
    }
    catch {
        Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "memory-inventory-blocked" -Message "Installed RAM could not be read with standard-user APIs. Ask IT to allow read-only hardware inventory or confirm at least 48 GB is installed."
    }
}
$installedMemoryGB = [math]::Round($installedMemoryBytes / 1GB, 1)
$memoryPassThresholdBytes = if ($memorySource -eq "PhysicalModules") { [double]48GB } else { [double](47.5 * 1GB) }
$memoryPassed = [bool]($installedMemoryBytes -ge $memoryPassThresholdBytes)
if ($installedMemoryBytes -gt 0 -and -not $memoryPassed) {
    Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "memory-below-minimum" -Message "At least 48 GB of installed RAM is required; detected $installedMemoryGB GB. A memory upgrade requires IT/admin action on a managed work PC."
}

$videoControllers = @()
try {
    $videoControllers = @(Get-CimInstance Win32_VideoController -ErrorAction Stop)
}
catch {
    $pnpCommand = Get-Command Get-PnpDevice -ErrorAction SilentlyContinue
    if ($pnpCommand) {
        try {
            $videoControllers = @(
                Get-PnpDevice -Class Display -ErrorAction Stop |
                    ForEach-Object {
                        [pscustomobject]@{
                            Name = $_.FriendlyName
                            DriverVersion = $null
                        }
                    }
            )
        }
        catch {
            Write-Verbose "Display adapter inventory was blocked for the standard user."
        }
    }
}
$supportedGpu = $videoControllers |
    Where-Object { Test-CardioSupportedGpuName -Name ([string]$_.Name) } |
    Select-Object -First 1
$gpuNames = @($videoControllers | ForEach-Object { [string]$_.Name } | Where-Object { $_ })
if (-not $supportedGpu) {
    if ($gpuNames.Count -gt 0) {
        Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "gpu-below-minimum" -Message "A desktop NVIDIA RTX 4080/4090 or RTX 5080/5090 is required; detected: $($gpuNames -join '; '). A hardware change requires IT/admin action."
    }
    else {
        Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "gpu-inventory-blocked" -Message "The display adapter could not be read with standard-user APIs. Ask IT to confirm a desktop NVIDIA RTX 4080/4090 or RTX 5080/5090."
    }
}
else {
    $studioDriverMessage = "Ask IT to confirm in NVIDIA App that the current Studio Driver is installed. Windows inventory reports a version but cannot reliably distinguish Studio from Game Ready."
    $warnings.Add($studioDriverMessage)
    $itRecommendations.Add($studioDriverMessage)
}

$git = Get-Command git.exe -ErrorAction SilentlyContinue
if (-not $git) { $git = Get-Command git -ErrorAction SilentlyContinue }
if (-not $git) {
    Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "git-missing" -Message "Git for Windows was not found. On this non-admin work PC, ask IT to install or approve Git and place git.exe on PATH."
}

$nodeInfo = Get-CardioNodeInfo -RequiredMajorVersion 24
if (-not $nodeInfo.MeetsRequiredMajor) {
    if ($nodeInfo.Found) {
        Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "node-version" -Message "Node.js 24 is required; detected: $($nodeInfo.Detected -join ', '). Ask IT to provide Node.js 24, or use the Codex bundled runtime if available."
    }
    else {
        Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "node-missing" -Message "Node.js 24 was not found on PATH or in the Codex bundled runtime. Ask IT to provide Node.js 24 on this managed PC."
    }
}

$enginePath = $null
try {
    $enginePath = Resolve-CardioEngineRoot -EngineRoot $EngineRoot
}
catch {
    if ($EngineRoot -or $env:UE_5_8_ROOT) {
        Add-CardioReadinessIssue -Category UserAction -Code "unreal-path-invalid" -Message "$($_.Exception.Message) Correct -EngineRoot or UE_5_8_ROOT; no admin rights are needed when UE 5.8 is already installed in a readable location."
    }
    else {
        Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "unreal-missing" -Message "$($_.Exception.Message) On this non-admin work PC, ask IT to install/approve UE 5.8 or provide its existing readable path."
    }
}

$visualStudio = $null
try {
    $visualStudio = Get-CardioVisualStudioInfo
    if (-not $visualStudio.Found) {
        Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "visual-studio-missing" -Message "A supported Visual Studio was not found. Unreal Engine 5.8 supports Visual Studio 2022 17.14+ and recommends Visual Studio 2026. Ask IT to install it with 'Game development with C++'."
    }
    else {
        if (-not $visualStudio.MeetsMinimumVersion) {
            Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "visual-studio-version" -Message "Unreal Engine 5.8 requires Visual Studio 2022 17.14+ or Visual Studio 2026; detected $($visualStudio.Version). Ask IT to update Visual Studio."
        }
        if (-not $visualStudio.HasGameCppWorkload) {
            Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "visual-studio-game-workload" -Message "Visual Studio is missing 'Game development with C++' (Microsoft.VisualStudio.Workload.NativeGame). Ask IT to add it with Visual Studio Installer."
        }
        if (-not $visualStudio.HasMsvcX64) {
            Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "msvc-missing" -Message "Visual Studio does not contain an x64 MSVC compiler. Ask IT to add the current x64/x86 C++ build tools."
        }
        elseif (-not $visualStudio.MeetsMinimumMsvc) {
            Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "msvc-version" -Message "Unreal Engine 5.8 requires MSVC 14.38 or newer; detected $($visualStudio.CompilerVersion). Ask IT to add a current MSVC toolset."
        }
    }
}
catch {
    Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "visual-studio-inventory" -Message "Visual Studio inventory failed without making changes: $($_.Exception.Message). Ask IT to confirm the installation is readable by your account."
}

$windowsSdk = $null
try {
    $windowsSdk = Get-CardioWindowsSdkInfo -MinimumVersion ([version]"10.0.22621.0")
    if (-not $windowsSdk.Found) {
        Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "windows-sdk-missing" -Message "A complete Windows SDK was not found. Ask IT to add Windows SDK 10.0.22621.0 or newer with Visual Studio Installer."
    }
    elseif (-not $windowsSdk.MeetsMinimumVersion) {
        Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "windows-sdk-version" -Message "Unreal Engine 5.8 requires Windows SDK 10.0.22621.0 or newer; detected $($windowsSdk.Version). Ask IT to update the SDK."
    }
}
catch {
    Add-CardioReadinessIssue -Category ITOrAdminRequired -Code "windows-sdk-inventory" -Message "Windows SDK inventory failed without making changes: $($_.Exception.Message). Ask IT to confirm the SDK is readable by your account."
}

$projectRoot = Get-CardioProjectRoot
$freeDiskGB = $null
$diskRoot = [System.IO.Path]::GetPathRoot($projectRoot)
if (-not $SkipDiskCheck) {
    try {
        $drive = [System.IO.DriveInfo]::new($diskRoot)
        if (-not $drive.IsReady) { throw "Drive $diskRoot is not ready." }
        $freeDiskGB = [math]::Round($drive.AvailableFreeSpace / 1GB, 1)
        if ($drive.AvailableFreeSpace -lt ($MinimumFreeDiskGB * 1GB)) {
            Add-CardioReadinessIssue -Category UserAction -Code "disk-space" -Message "The project drive needs at least $MinimumFreeDiskGB GB free for Unreal build, cook, and package output; $freeDiskGB GB is free on $diskRoot. Free space or move the checkout to an approved drive."
        }
    }
    catch {
        Add-CardioReadinessIssue -Category UserAction -Code "disk-inventory" -Message "Free space on the project drive could not be checked: $($_.Exception.Message)"
    }
}

$isElevated = $false
try {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    $isElevated = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
catch {
    Write-Verbose "Elevation state could not be determined."
}

function New-CardioWorkstationReport {
    $userActions = @($script:readinessIssues | Where-Object { $_.category -eq "UserAction" })
    $itActions = @($script:readinessIssues | Where-Object { $_.category -eq "ITOrAdminRequired" })
    return [ordered]@{
        SchemaVersion = 2
        GeneratedAtUtc = [DateTime]::UtcNow.ToString("o")
        Passed = ($script:readinessIssues.Count -eq 0)
        StandardUserSafe = $true
        RequiresElevationToRun = $false
        SharingNote = "This report contains local workstation inventory. Keep it out of source control and share only with authorized IT staff."
        Windows = [ordered]@{
            Passed = $isWindows11
            Caption = $osCaption
            BuildNumber = $osBuildNumber
        }
        Memory = [ordered]@{
            Passed = $memoryPassed
            InstalledGB = $installedMemoryGB
            RequiredGB = 48
            InventorySource = $memorySource
        }
        GPU = [ordered]@{
            Passed = [bool]$supportedGpu
            Selected = if ($supportedGpu) { [string]$supportedGpu.Name } else { $null }
            Detected = $gpuNames
            DriverVersion = if ($supportedGpu) { [string]$supportedGpu.DriverVersion } else { $null }
            RequiredClass = "Desktop NVIDIA RTX 4080/4090 or RTX 5080/5090"
            StudioDriverVerification = "manual"
        }
        Disk = [ordered]@{
            Passed = [bool]($SkipDiskCheck -or ($null -ne $freeDiskGB -and $freeDiskGB -ge $MinimumFreeDiskGB))
            Root = $diskRoot
            FreeGB = $freeDiskGB
            RequiredFreeGB = if ($SkipDiskCheck) { $null } else { $MinimumFreeDiskGB }
            Skipped = [bool]$SkipDiskCheck
        }
        Unreal = [ordered]@{
            Passed = [bool]$enginePath
            Version = if ($enginePath) { "5.8" } else { $null }
            Root = $enginePath
        }
        VisualStudio = [ordered]@{
            Passed = [bool](
                $visualStudio -and
                $visualStudio.Found -and
                $visualStudio.MeetsMinimumVersion -and
                $visualStudio.HasGameCppWorkload -and
                $visualStudio.HasMsvcX64 -and
                $visualStudio.MeetsMinimumMsvc
            )
            Version = if ($visualStudio) { $visualStudio.Version } else { $null }
            MinimumVersion = "Visual Studio 2022 17.14 or Visual Studio 2026"
            GameCppWorkload = [bool]($visualStudio -and $visualStudio.HasGameCppWorkload)
            MsvcX64Compiler = if ($visualStudio) { $visualStudio.CompilerPath } else { $null }
            MsvcVersion = if ($visualStudio) { $visualStudio.CompilerVersion } else { $null }
            MinimumMsvcVersion = "14.38"
            InstallationPath = if ($visualStudio) { $visualStudio.InstallationPath } else { $null }
        }
        WindowsSdk = [ordered]@{
            Passed = [bool]($windowsSdk -and $windowsSdk.Found -and $windowsSdk.MeetsMinimumVersion)
            Version = if ($windowsSdk) { $windowsSdk.Version } else { $null }
            MinimumVersion = "10.0.22621.0"
            Root = if ($windowsSdk) { $windowsSdk.Root } else { $null }
        }
        Git = [ordered]@{
            Passed = [bool]$git
            Path = if ($git) { $git.Source } else { $null }
        }
        Node = [ordered]@{
            Passed = [bool]$nodeInfo.MeetsRequiredMajor
            Version = $nodeInfo.Version
            Path = $nodeInfo.Path
            RequiredMajor = 24
        }
        RunningElevated = $isElevated
        ActionSummary = [ordered]@{
            UserAction = $userActions
            ITOrAdminRequired = $itActions
            ITRecommendations = @($itRecommendations)
        }
        Warnings = @($warnings)
        Failures = @($script:readinessIssues)
    }
}

$report = New-CardioWorkstationReport
$reportJson = $report | ConvertTo-Json -Depth 8
$resolvedReportPath = $null
if ($ReportPath) {
    try {
        $reportCandidate = if ([System.IO.Path]::IsPathRooted($ReportPath)) {
            $ReportPath
        }
        else {
            Join-Path $projectRoot $ReportPath
        }
        $resolvedReportPath = [System.IO.Path]::GetFullPath($reportCandidate)
        if ([System.IO.Path]::GetExtension($resolvedReportPath) -ne ".json") {
            throw "The report path must end in .json."
        }
        if (Test-Path -LiteralPath $resolvedReportPath) {
            throw "The report path already exists; choose a new filename to avoid overwriting local data: $resolvedReportPath"
        }
        $projectBoundary = "$($projectRoot.TrimEnd('\', '/'))$([System.IO.Path]::DirectorySeparatorChar)"
        $savedRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot "Saved")).TrimEnd("\", "/")
        $savedBoundary = "$savedRoot$([System.IO.Path]::DirectorySeparatorChar)"
        if (
            $resolvedReportPath.StartsWith($projectBoundary, [System.StringComparison]::OrdinalIgnoreCase) -and
            -not $resolvedReportPath.StartsWith($savedBoundary, [System.StringComparison]::OrdinalIgnoreCase)
        ) {
            throw "Reports inside the Unreal project must be written under Saved so local workstation details cannot enter source control."
        }
        $reportParent = Split-Path -Parent $resolvedReportPath
        if (-not $reportParent) { throw "The report path has no parent directory." }
        New-Item -ItemType Directory -Path $reportParent -Force -ErrorAction Stop | Out-Null
        [System.IO.File]::WriteAllText($resolvedReportPath, "$reportJson`n", [System.Text.UTF8Encoding]::new($false))
    }
    catch {
        Add-CardioReadinessIssue -Category UserAction -Code "report-write" -Message "The requested IT report could not be written: $($_.Exception.Message)"
        $report = New-CardioWorkstationReport
        $reportJson = $report | ConvertTo-Json -Depth 8
        $resolvedReportPath = $null
    }
}

$reportJson
if ($resolvedReportPath) {
    Write-Host "IT-ready workstation report: $resolvedReportPath" -ForegroundColor Cyan
}
foreach ($warning in $warnings) { Write-Warning $warning }

if ($script:readinessIssues.Count -gt 0) {
    $userActionIssues = @($script:readinessIssues | Where-Object { $_.category -eq "UserAction" })
    $itActionIssues = @($script:readinessIssues | Where-Object { $_.category -eq "ITOrAdminRequired" })
    if ($userActionIssues.Count -gt 0) {
        Write-Host "`nYou can address without admin rights:" -ForegroundColor Yellow
        foreach ($issue in $userActionIssues) { Write-Host "  - $($issue.message)" -ForegroundColor Yellow }
    }
    if ($itActionIssues.Count -gt 0) {
        Write-Host "`nAsk IT/admin to address:" -ForegroundColor Red
        foreach ($issue in $itActionIssues) { Write-Host "  - $($issue.message)" -ForegroundColor Red }
    }
    throw "Workstation prerequisite check failed with $($script:readinessIssues.Count) blocking issue(s). No installation or elevation was attempted."
}

Write-Host "Workstation prerequisite check passed without requiring elevation." -ForegroundColor Green
