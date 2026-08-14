[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

function Find-UnrealEditor {
    $roots = @(
        "C:\Program Files\Epic Games",
        "D:\Epic Games",
        "D:\Program Files\Epic Games"
    )
    foreach ($root in $roots) {
        if (-not (Test-Path $root)) { continue }
        $candidate = Get-ChildItem $root -Directory -Filter "UE_5.8*" -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName "Engine\Binaries\Win64\UnrealEditor.exe" } |
            Where-Object { Test-Path $_ } |
            Select-Object -First 1
        if ($candidate) { return $candidate }
    }
    return $null
}

$gpu = Get-CimInstance Win32_VideoController |
    Sort-Object AdapterRAM -Descending |
    Select-Object -First 1 Name, DriverVersion, AdapterRAM
$computer = Get-CimInstance Win32_ComputerSystem
$os = Get-CimInstance Win32_OperatingSystem
$unreal = Find-UnrealEditor
$git = Get-Command git -ErrorAction SilentlyContinue
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$node = if ($nodeCommand) {
    $nodeCommand.Source
}
else {
    $candidate = Join-Path ([Environment]::GetFolderPath("UserProfile")) ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
    if (Test-Path -LiteralPath $candidate) { $candidate } else { $null }
}

$report = [ordered]@{
    Windows = $os.Caption
    MemoryGB = [math]::Round($computer.TotalPhysicalMemory / 1GB, 1)
    GPU = $gpu.Name
    GPUDriver = $gpu.DriverVersion
    UnrealEditor = $unreal
    Git = if ($git) { $git.Source } else { $null }
    Node = $node
}

$report | ConvertTo-Json

$failures = @()
if (-not $unreal) { $failures += "Unreal Engine 5.8 was not found." }
if (-not $git) { $failures += "Git for Windows was not found." }
if (-not $node) { $failures += "Node.js 24 was not found." }
if ($os.Caption -notmatch "Windows 11") { $failures += "Windows 11 is required." }
if ($computer.TotalPhysicalMemory -lt 48GB) { $failures += "Less than 48 GB RAM is available." }
if ($gpu.Name -notmatch "RTX (4080|4090)") { $failures += "An RTX 4080 or RTX 4090 was not selected as the primary adapter." }

if ($failures.Count -gt 0) {
    Write-Error ($failures -join " ")
}

Write-Host "Workstation prerequisite check passed." -ForegroundColor Green

