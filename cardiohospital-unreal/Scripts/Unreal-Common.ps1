Set-StrictMode -Version Latest

$script:CardioScriptsRoot = $PSScriptRoot

function Get-CardioProjectRoot {
    return [System.IO.Path]::GetFullPath((Split-Path -Parent $script:CardioScriptsRoot))
}

function Get-CardioProjectFile {
    $projectFile = Join-Path (Get-CardioProjectRoot) "CardioHospital.uproject"
    if (-not (Test-Path -LiteralPath $projectFile -PathType Leaf)) {
        throw "The Unreal project file was not found: $projectFile"
    }
    return $projectFile
}

function Get-CardioRelativePath {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$BasePath,

        [Parameter(Mandatory)]
        [string]$Path
    )

    $baseFullPath = [System.IO.Path]::GetFullPath($BasePath).TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar
    $pathFullPath = [System.IO.Path]::GetFullPath($Path)
    $relativeUri = ([Uri]$baseFullPath).MakeRelativeUri([Uri]$pathFullPath)
    return [Uri]::UnescapeDataString($relativeUri.ToString()).Replace("/", "\")
}

function Get-CardioEngineInspection {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    try {
        $expandedPath = [Environment]::ExpandEnvironmentVariables($Path.Trim().Trim('"'))
        $fullPath = [System.IO.Path]::GetFullPath($expandedPath).TrimEnd("\", "/")
    }
    catch {
        return [pscustomobject]@{
            Path = $Path
            Version = $null
            IsValid = $false
            Problem = "The path is invalid: $($_.Exception.Message)"
        }
    }

    if (-not (Test-Path -LiteralPath $fullPath -PathType Container)) {
        return [pscustomobject]@{
            Path = $fullPath
            Version = $null
            IsValid = $false
            Problem = "The directory does not exist."
        }
    }

    $buildVersionPath = Join-Path $fullPath "Engine\Build\Build.version"
    $version = $null
    if (Test-Path -LiteralPath $buildVersionPath -PathType Leaf) {
        try {
            $buildVersion = Get-Content -Raw -LiteralPath $buildVersionPath | ConvertFrom-Json
            $version = "$($buildVersion.MajorVersion).$($buildVersion.MinorVersion)"
        }
        catch {
            return [pscustomobject]@{
                Path = $fullPath
                Version = $null
                IsValid = $false
                Problem = "Engine\Build\Build.version could not be read: $($_.Exception.Message)"
            }
        }
    }
    else {
        return [pscustomobject]@{
            Path = $fullPath
            Version = $null
            IsValid = $false
            Problem = "Engine\Build\Build.version is missing."
        }
    }

    if ($version -ne "5.8") {
        return [pscustomobject]@{
            Path = $fullPath
            Version = $version
            IsValid = $false
            Problem = "Unreal Engine $version is installed here; this project requires 5.8."
        }
    }

    $requiredFiles = @(
        "Engine\Build\BatchFiles\Build.bat",
        "Engine\Build\BatchFiles\GenerateProjectFiles.bat",
        "Engine\Build\BatchFiles\RunUAT.bat",
        "Engine\Binaries\Win64\UnrealEditor.exe",
        "Engine\Binaries\Win64\UnrealEditor-Cmd.exe"
    )
    $missingFiles = @(
        $requiredFiles | Where-Object {
            -not (Test-Path -LiteralPath (Join-Path $fullPath $_) -PathType Leaf)
        }
    )
    if ($missingFiles.Count -gt 0) {
        return [pscustomobject]@{
            Path = $fullPath
            Version = $version
            IsValid = $false
            Problem = "The installation is incomplete; missing: $($missingFiles -join ', ')"
        }
    }

    return [pscustomobject]@{
        Path = $fullPath
        Version = $version
        IsValid = $true
        Problem = $null
    }
}

function Get-CardioEpicLauncherEngineRoots {
    $roots = [System.Collections.Generic.List[string]]::new()

    if ($env:ProgramData) {
        $launcherData = Join-Path $env:ProgramData "Epic\UnrealEngineLauncher\LauncherInstalled.dat"
        if (Test-Path -LiteralPath $launcherData -PathType Leaf) {
            try {
                $installations = Get-Content -Raw -LiteralPath $launcherData | ConvertFrom-Json
                foreach ($installation in @($installations.InstallationList)) {
                    if ($installation.AppName -match '^UE_5\.8(?:$|\.)' -and $installation.InstallLocation) {
                        $roots.Add([string]$installation.InstallLocation)
                    }
                }
            }
            catch {
                Write-Verbose "Epic Launcher installation data could not be read: $($_.Exception.Message)"
            }
        }
    }

    foreach ($registryPath in @(
        "Registry::HKEY_LOCAL_MACHINE\SOFTWARE\EpicGames\Unreal Engine\5.8",
        "Registry::HKEY_CURRENT_USER\SOFTWARE\EpicGames\Unreal Engine\5.8"
    )) {
        try {
            $installedDirectory = (Get-ItemProperty -LiteralPath $registryPath -ErrorAction Stop).InstalledDirectory
            if ($installedDirectory) { $roots.Add([string]$installedDirectory) }
        }
        catch {
            Write-Verbose "No Unreal Engine 5.8 registry entry was found at $registryPath."
        }
    }

    return @($roots | Select-Object -Unique)
}

function Resolve-CardioEngineRoot {
    [CmdletBinding()]
    param(
        [string]$EngineRoot
    )

    if ($EngineRoot) {
        $inspection = Get-CardioEngineInspection -Path $EngineRoot
        if (-not $inspection.IsValid) {
            throw "The Unreal Engine root supplied with -EngineRoot is not usable: $($inspection.Path). $($inspection.Problem)"
        }
        return $inspection.Path
    }

    if ($env:UE_5_8_ROOT) {
        $inspection = Get-CardioEngineInspection -Path $env:UE_5_8_ROOT
        if (-not $inspection.IsValid) {
            throw "UE_5_8_ROOT points to an unusable installation: $($inspection.Path). $($inspection.Problem)"
        }
        return $inspection.Path
    }

    $candidates = [System.Collections.Generic.List[string]]::new()
    foreach ($candidate in @(Get-CardioEpicLauncherEngineRoots)) {
        if ($candidate) { $candidates.Add([string]$candidate) }
    }

    foreach ($candidate in @(
        "C:\Program Files\Epic Games\UE_5.8",
        "D:\Epic Games\UE_5.8",
        "D:\Program Files\Epic Games\UE_5.8"
    )) {
        $candidates.Add($candidate)
    }

    foreach ($parent in @(
        "C:\Program Files\Epic Games",
        "D:\Epic Games",
        "D:\Program Files\Epic Games"
    )) {
        if (-not (Test-Path -LiteralPath $parent -PathType Container)) { continue }
        Get-ChildItem -LiteralPath $parent -Directory -Filter "UE_5.8*" -ErrorAction SilentlyContinue |
            ForEach-Object { $candidates.Add($_.FullName) }
    }

    $problems = [System.Collections.Generic.List[string]]::new()
    foreach ($candidate in @($candidates | Select-Object -Unique)) {
        $inspection = Get-CardioEngineInspection -Path $candidate
        if ($inspection.IsValid) { return $inspection.Path }
        if (Test-Path -LiteralPath $inspection.Path) {
            $problems.Add("$($inspection.Path): $($inspection.Problem)")
        }
    }

    $detail = if ($problems.Count -gt 0) {
        " Detected unusable candidates: $($problems -join '; ')"
    }
    else {
        ""
    }
    throw "Unreal Engine 5.8 was not found. Install it with Epic Games Launcher, pass -EngineRoot, or set UE_5_8_ROOT to the engine directory.$detail"
}

function Get-CardioVsWherePath {
    $command = Get-Command vswhere.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }

    $programFilesX86 = ${env:ProgramFiles(x86)}
    if ($programFilesX86) {
        $candidate = Join-Path $programFilesX86 "Microsoft Visual Studio\Installer\vswhere.exe"
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    if ($env:LOCALAPPDATA) {
        $candidate = Join-Path $env:LOCALAPPDATA "Microsoft\VisualStudio\Installer\vswhere.exe"
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    return $null
}

function Invoke-CardioVsWhere {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$VsWherePath,

        [string[]]$RequiredComponents = @()
    )

    $arguments = @("-products", "*", "-version", "[17.0,19.0)")
    foreach ($component in $RequiredComponents) {
        $arguments += @("-requires", $component)
    }
    $arguments += @("-format", "json", "-utf8")

    $json = & $VsWherePath @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "vswhere.exe failed with exit code $LASTEXITCODE."
    }
    if (-not $json) { return @() }

    try {
        return @($json | ConvertFrom-Json)
    }
    catch {
        throw "vswhere.exe returned invalid JSON: $($_.Exception.Message)"
    }
}

function ConvertTo-CardioVersion {
    [CmdletBinding()]
    param(
        [AllowNull()]
        [string]$Value
    )

    if (-not $Value) { return [version]"0.0" }
    $parsed = [version]"0.0"
    if ([version]::TryParse($Value, [ref]$parsed)) { return $parsed }
    return [version]"0.0"
}

function Get-CardioVisualStudioInfo {
    [CmdletBinding()]
    param(
        [string]$VsWherePath
    )

    if (-not $VsWherePath) { $VsWherePath = Get-CardioVsWherePath }
    if (-not $VsWherePath) {
        return [pscustomobject]@{
            Found = $false
            MeetsMinimumVersion = $false
            HasGameCppWorkload = $false
            HasMsvcX64 = $false
            MeetsMinimumMsvc = $false
            Version = $null
            InstallationPath = $null
            VsWherePath = $null
            CompilerPath = $null
            CompilerVersion = $null
        }
    }

    $allInstances = @(Invoke-CardioVsWhere -VsWherePath $VsWherePath)
    $gameInstances = @(
        Invoke-CardioVsWhere -VsWherePath $VsWherePath -RequiredComponents @(
            "Microsoft.VisualStudio.Workload.NativeGame"
        )
    )
    $eligibleInstances = if ($gameInstances.Count -gt 0) { $gameInstances } else { $allInstances }
    $selected = @($eligibleInstances) |
        Where-Object { $_.installationPath } |
        Sort-Object { ConvertTo-CardioVersion -Value ([string]$_.installationVersion) } -Descending |
        Select-Object -First 1

    if (-not $selected) {
        return [pscustomobject]@{
            Found = $false
            MeetsMinimumVersion = $false
            HasGameCppWorkload = $false
            HasMsvcX64 = $false
            MeetsMinimumMsvc = $false
            Version = $null
            InstallationPath = $null
            VsWherePath = $VsWherePath
            CompilerPath = $null
            CompilerVersion = $null
        }
    }

    $selectedPath = [string]$selected.installationPath
    $compilerInstallation = Get-ChildItem -LiteralPath (Join-Path $selectedPath "VC\Tools\MSVC") -Directory -ErrorAction SilentlyContinue |
        Sort-Object { ConvertTo-CardioVersion -Value $_.Name } -Descending |
        Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "bin\Hostx64\x64\cl.exe") -PathType Leaf } |
        Select-Object -First 1
    $compiler = if ($compilerInstallation) {
        Join-Path $compilerInstallation.FullName "bin\Hostx64\x64\cl.exe"
    }
    else {
        $null
    }
    $compilerVersion = if ($compilerInstallation) {
        ConvertTo-CardioVersion -Value $compilerInstallation.Name
    }
    else {
        [version]"0.0"
    }
    $selectedVersion = ConvertTo-CardioVersion -Value ([string]$selected.installationVersion)
    $meetsMinimumVersion = [bool](
        $selectedVersion.Major -gt 17 -or
        ($selectedVersion.Major -eq 17 -and $selectedVersion -ge [version]"17.14")
    )
    $gameInstallationPaths = @($gameInstances | ForEach-Object { [string]$_.installationPath })

    return [pscustomobject]@{
        Found = $true
        MeetsMinimumVersion = $meetsMinimumVersion
        HasGameCppWorkload = ($gameInstallationPaths -contains $selectedPath)
        HasMsvcX64 = [bool]$compiler
        MeetsMinimumMsvc = ($compilerVersion -ge [version]"14.38")
        Version = [string]$selected.installationVersion
        InstallationPath = $selectedPath
        VsWherePath = $VsWherePath
        CompilerPath = $compiler
        CompilerVersion = if ($compilerInstallation) { $compilerInstallation.Name } else { $null }
    }
}

function Get-CardioWindowsSdkInfo {
    [CmdletBinding()]
    param(
        [string[]]$SearchRoots,
        [version]$MinimumVersion = [version]"10.0.22621.0"
    )

    $roots = [System.Collections.Generic.List[string]]::new()
    if ($PSBoundParameters.ContainsKey("SearchRoots")) {
        foreach ($root in $SearchRoots) {
            if ($root) { $roots.Add($root) }
        }
    }
    else {
        if ($env:WindowsSdkDir) {
            $roots.Add([string]$env:WindowsSdkDir)
        }
        try {
            $userKitsRoot = (Get-ItemProperty -LiteralPath "Registry::HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows Kits\Installed Roots" -ErrorAction Stop).KitsRoot10
            if ($userKitsRoot) { $roots.Add([string]$userKitsRoot) }
        }
        catch {
            Write-Verbose "The per-user Windows Kits registry entry was not available."
        }
        try {
            $kitsRoot = (Get-ItemProperty -LiteralPath "Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Kits\Installed Roots" -ErrorAction Stop).KitsRoot10
            if ($kitsRoot) { $roots.Add([string]$kitsRoot) }
        }
        catch {
            Write-Verbose "The Windows Kits registry entry was not available."
        }
        if (${env:ProgramFiles(x86)}) {
            $roots.Add((Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10"))
        }
    }

    $installations = [System.Collections.Generic.List[object]]::new()
    foreach ($root in @($roots | Select-Object -Unique)) {
        $includeRoot = Join-Path $root "Include"
        if (-not (Test-Path -LiteralPath $includeRoot -PathType Container)) { continue }
        foreach ($directory in @(Get-ChildItem -LiteralPath $includeRoot -Directory -ErrorAction SilentlyContinue)) {
            $sdkVersion = ConvertTo-CardioVersion -Value $directory.Name
            if ($sdkVersion -eq [version]"0.0") { continue }

            $windowsHeader = Join-Path $directory.FullName "um\Windows.h"
            $sharedHeader = Join-Path $directory.FullName "shared\sdkddkver.h"
            $resourceCompiler = Join-Path $root "bin\$($directory.Name)\x64\rc.exe"
            $user32Library = Join-Path $root "Lib\$($directory.Name)\um\x64\User32.Lib"
            if (
                (Test-Path -LiteralPath $windowsHeader -PathType Leaf) -and
                (Test-Path -LiteralPath $sharedHeader -PathType Leaf) -and
                (Test-Path -LiteralPath $resourceCompiler -PathType Leaf) -and
                (Test-Path -LiteralPath $user32Library -PathType Leaf)
            ) {
                $installations.Add([pscustomobject]@{
                    Root = [System.IO.Path]::GetFullPath($root)
                    Version = $sdkVersion
                    VersionString = $directory.Name
                })
            }
        }
    }

    $selected = $installations |
        Sort-Object Version -Descending |
        Select-Object -First 1
    if (-not $selected) {
        return [pscustomobject]@{
            Found = $false
            MeetsMinimumVersion = $false
            Version = $null
            Root = $null
            MinimumVersion = $MinimumVersion.ToString()
        }
    }

    return [pscustomobject]@{
        Found = $true
        MeetsMinimumVersion = ($selected.Version -ge $MinimumVersion)
        Version = $selected.VersionString
        Root = $selected.Root
        MinimumVersion = $MinimumVersion.ToString()
    }
}

function Get-CardioNodeInfo {
    [CmdletBinding()]
    param(
        [int]$RequiredMajorVersion = 24
    )

    $candidates = [System.Collections.Generic.List[string]]::new()
    $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $nodeCommand) { $nodeCommand = Get-Command node -ErrorAction SilentlyContinue }
    if ($nodeCommand) { $candidates.Add($nodeCommand.Source) }

    $bundledCandidate = Join-Path ([Environment]::GetFolderPath("UserProfile")) ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
    if (Test-Path -LiteralPath $bundledCandidate -PathType Leaf) {
        $candidates.Add($bundledCandidate)
    }

    $detected = [System.Collections.Generic.List[string]]::new()
    foreach ($candidate in @($candidates | Select-Object -Unique)) {
        try {
            $versionText = (& $candidate --version 2>$null).Trim()
            $nodeVersion = ConvertTo-CardioVersion -Value $versionText.TrimStart("v")
            if ($nodeVersion -ne [version]"0.0") {
                $detected.Add("$candidate ($versionText)")
                if ($nodeVersion.Major -eq $RequiredMajorVersion) {
                    return [pscustomobject]@{
                        Found = $true
                        MeetsRequiredMajor = $true
                        Path = $candidate
                        Version = $versionText
                        Detected = @($detected)
                    }
                }
            }
        }
        catch {
            Write-Verbose "Node.js candidate could not be queried: $candidate"
        }
    }

    return [pscustomobject]@{
        Found = ($detected.Count -gt 0)
        MeetsRequiredMajor = $false
        Path = $null
        Version = $null
        Detected = @($detected)
    }
}

function Resolve-CardioNode {
    [CmdletBinding()]
    param(
        [int]$RequiredMajorVersion = 24
    )

    $info = Get-CardioNodeInfo -RequiredMajorVersion $RequiredMajorVersion
    if ($info.MeetsRequiredMajor) { return $info.Path }
    if ($info.Found) {
        throw "Node.js $RequiredMajorVersion is required. Other Node.js installations were detected: $($info.Detected -join ', ')"
    }
    throw "Node.js $RequiredMajorVersion was not found on PATH or in the Codex bundled runtime."
}

function Test-CardioSupportedGpuName {
    [CmdletBinding()]
    param(
        [AllowNull()]
        [string]$Name
    )

    if (-not $Name) { return $false }
    if ($Name -notmatch '(?i)NVIDIA') { return $false }
    if ($Name -match '(?i)Laptop') { return $false }
    return ($Name -match '(?i)\bRTX\s*(4080|4090|5080|5090)\b')
}

function Initialize-CardioOutputDirectory {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter(Mandatory)]
        [string]$Purpose
    )

    $projectRoot = Get-CardioProjectRoot
    $candidate = if ([System.IO.Path]::IsPathRooted($Path)) {
        $Path
    }
    else {
        Join-Path $projectRoot $Path
    }
    $fullPath = [System.IO.Path]::GetFullPath($candidate).TrimEnd("\", "/")
    $pathRoot = [System.IO.Path]::GetPathRoot($fullPath).TrimEnd("\", "/")
    if ($fullPath -eq $pathRoot) {
        throw "$Purpose cannot use a drive root as its output directory: $fullPath"
    }
    if ($fullPath -eq $projectRoot.TrimEnd("\", "/")) {
        throw "$Purpose cannot use the Unreal project root as its output directory."
    }
    if ($projectRoot.StartsWith("$fullPath$([System.IO.Path]::DirectorySeparatorChar)", [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "$Purpose cannot use an ancestor of the Unreal project as its output directory: $fullPath"
    }
    if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
        throw "$Purpose output path is an existing file: $fullPath"
    }
    if (Test-Path -LiteralPath $fullPath -PathType Container) {
        $existingItem = Get-ChildItem -LiteralPath $fullPath -Force -ErrorAction Stop | Select-Object -First 1
        if ($null -ne $existingItem) {
            throw "$Purpose output directory is not empty: $fullPath. Choose a new or empty directory so stale artifacts cannot enter the result."
        }
    }
    else {
        New-Item -ItemType Directory -Path $fullPath -Force -ErrorAction Stop | Out-Null
    }
    return $fullPath
}

function Get-CardioGitProvenance {
    [CmdletBinding()]
    param(
        [string]$ProjectRoot = (Get-CardioProjectRoot)
    )

    $git = Get-Command git.exe -ErrorAction SilentlyContinue
    if (-not $git) { $git = Get-Command git -ErrorAction SilentlyContinue }
    if (-not $git) {
        throw "Git for Windows is required to create verifiable package provenance."
    }

    $repositoryRoot = (& $git.Source -C $ProjectRoot rev-parse --show-toplevel 2>$null | Select-Object -First 1)
    if ($LASTEXITCODE -ne 0 -or -not $repositoryRoot) {
        throw "The Unreal project is not inside a readable Git worktree: $ProjectRoot"
    }
    $repositoryRoot = [System.IO.Path]::GetFullPath(([string]$repositoryRoot).Trim())

    $commit = (& $git.Source -C $ProjectRoot rev-parse --verify HEAD 2>$null | Select-Object -First 1)
    if ($LASTEXITCODE -ne 0 -or -not $commit) {
        throw "Git HEAD could not be resolved. Commit the package source before packaging."
    }
    $commit = ([string]$commit).Trim().ToLowerInvariant()
    if ($commit -notmatch '^[0-9a-f]{40,64}$') {
        throw "Git returned an invalid HEAD object id: $commit"
    }

    $statusLines = @(& $git.Source -C $ProjectRoot status --porcelain=v1 --untracked-files=all -- .)
    if ($LASTEXITCODE -ne 0) {
        throw "Git could not inspect the Unreal project worktree state."
    }
    if ($statusLines.Count -gt 0) {
        $preview = @($statusLines | Select-Object -First 10) -join "; "
        if ($statusLines.Count -gt 10) { $preview += "; ..." }
        throw "The Unreal project contains uncommitted or untracked files ($preview). Commit or intentionally remove them before creating a verifiable package."
    }

    return [pscustomobject]@{
        RepositoryRoot = $repositoryRoot
        Commit = $commit
        ProjectPath = (Get-CardioRelativePath -BasePath $repositoryRoot -Path $ProjectRoot).Replace("\", "/")
        WorktreeState = "clean"
    }
}

function Invoke-CardioCommand {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FilePath,

        [Parameter(Mandatory)]
        [string[]]$ArgumentList,

        [string]$Description = "Command"
    )

    if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) {
        throw "$Description cannot start because the required command was not found: $FilePath"
    }

    Write-Host "==> $Description" -ForegroundColor Cyan
    & $FilePath @ArgumentList
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "$Description failed: $([System.IO.Path]::GetFileName($FilePath)) returned exit code $exitCode. Review the preceding command output for the first error."
    }
}
