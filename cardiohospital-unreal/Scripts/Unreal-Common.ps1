Set-StrictMode -Version Latest

function Get-CardioProjectRoot {
    return Split-Path -Parent $PSScriptRoot
}

function Get-CardioProjectFile {
    return Join-Path (Get-CardioProjectRoot) "CardioHospital.uproject"
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

function Resolve-CardioEngineRoot {
    [CmdletBinding()]
    param(
        [string]$EngineRoot
    )

    $candidates = [System.Collections.Generic.List[string]]::new()
    if ($EngineRoot) { $candidates.Add($EngineRoot) }
    if ($env:UE_5_8_ROOT) { $candidates.Add($env:UE_5_8_ROOT) }

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
        if (-not (Test-Path -LiteralPath $parent)) { continue }
        Get-ChildItem -LiteralPath $parent -Directory -Filter "UE_5.8*" -ErrorAction SilentlyContinue |
            ForEach-Object { $candidates.Add($_.FullName) }
    }

    foreach ($candidate in $candidates | Select-Object -Unique) {
        $resolved = [System.IO.Path]::GetFullPath($candidate)
        $buildScript = Join-Path $resolved "Engine\Build\BatchFiles\Build.bat"
        if (Test-Path -LiteralPath $buildScript) { return $resolved }
    }

    throw "Unreal Engine 5.8 was not found. Pass -EngineRoot or set UE_5_8_ROOT to the installed engine directory."
}

function Invoke-CardioCommand {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FilePath,

        [Parameter(Mandatory)]
        [string[]]$ArgumentList
    )

    if (-not (Test-Path -LiteralPath $FilePath)) {
        throw "Required Unreal command was not found: $FilePath"
    }

    & $FilePath @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "$([System.IO.Path]::GetFileName($FilePath)) failed with exit code $LASTEXITCODE."
    }
}
