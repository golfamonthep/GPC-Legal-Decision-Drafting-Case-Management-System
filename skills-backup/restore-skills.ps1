# Restore Codex Skills Script
# Run this script on a new machine to restore all 92 specialized skills into C:\Users\<USER>\.codex\skills
$target = "$HOME\.codex\skills"
if (!(Test-Path $target)) {
    New-Item -ItemType Directory -Force -Path $target | Out-Null
}
$zip = Join-Path $PSScriptRoot "codex-skills-bundle.zip"
Write-Host "Restoring skills to $target..."
Expand-Archive -Path $zip -DestinationPath $target -Force
Write-Host "Restored all skills successfully!"
