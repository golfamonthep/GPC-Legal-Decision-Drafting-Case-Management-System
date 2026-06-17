# scripts/check-project-intelligence.ps1
# Purpose: Verify that all required project intelligence files exist.
# Prints missing files and last-modified timestamps.
# Does NOT read file contents. Does NOT print secrets. Does NOT modify files.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/check-project-intelligence.ps1

$ErrorActionPreference = "Stop"

$requiredFiles = @(
    "SKILL.md",
    "ARCHITECTURE.md",
    "PROJECT_STATE.md",
    "DATABASE_SCHEMA.md",
    "COMPONENT_MAP.md"
)

# Resolve repo root (parent of this script's directory)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Project Intelligence Files Check" -ForegroundColor Cyan
Write-Host " Repo: $repoRoot" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$allPresent = $true

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $repoRoot $file
    if (Test-Path $fullPath) {
        $item = Get-Item $fullPath
        $sizeKb = [math]::Round($item.Length / 1024, 1)
        $lastModified = $item.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
        Write-Host "  [OK] $file" -ForegroundColor Green -NoNewline
        Write-Host "  ($sizeKb KB, last modified: $lastModified)" -ForegroundColor DarkGray
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
        $allPresent = $false
    }
}

Write-Host ""

if ($allPresent) {
    Write-Host "All required intelligence files are present." -ForegroundColor Green
} else {
    Write-Host "WARNING: One or more intelligence files are missing." -ForegroundColor Yellow
    Write-Host "Run Prompt 47.5 or create the missing files manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Reminder: Every prompt must read these files first and update them last." -ForegroundColor Cyan
Write-Host ""
