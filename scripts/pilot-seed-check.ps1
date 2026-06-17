param (
    [switch]$Detailed = $false
)

Write-Host "--- Pilot Seed Check ---"

$requiredFiles = @(
    "docs\pilot-data-trial-plan.md",
    "docs\pilot-seed-data-spec.md",
    "docs\pilot-workflow-checklist.md",
    "docs\pilot-data-cleanup-strategy.md",
    "docs\controlled-real-case-trial-protocol.md",
    "scripts\seed-pilot-data.ts"
)

$allFound = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        if ($Detailed) { Write-Host "[OK] Found $file" -ForegroundColor Green }
    } else {
        Write-Host "[FAIL] Missing $file" -ForegroundColor Red
        $allFound = $false
    }
}

if ($allFound) {
    Write-Host "`nAll pilot seed documents and scripts are present." -ForegroundColor Green
    Write-Host "Pilot data plan is ready; actual pilot seeding is not executed until explicitly approved."
} else {
    Write-Host "`nSome pilot seed files are missing. Please verify." -ForegroundColor Yellow
}
