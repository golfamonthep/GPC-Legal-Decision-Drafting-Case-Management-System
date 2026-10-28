$ErrorActionPreference = 'Stop'
Write-Host '[1/3] กำลังเตรียมโฟลเดอร์ติดตั้ง...' -ForegroundColor Cyan

$targetDir = [System.IO.Path]::Combine($env:LOCALAPPDATA, 'GPC_Registry_Updater')
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

Write-Host '[2/3] กำลังคัดลอกไฟล์โปรแกรม...' -ForegroundColor Cyan
$sourceDir = $PSScriptRoot
Copy-Item (Join-Path $sourceDir 'RegistryDropZone.ps1') (Join-Path $targetDir 'RegistryDropZone.ps1') -Force
Copy-Item (Join-Path $sourceDir 'Launch-DropZone.cmd') (Join-Path $targetDir 'Launch-DropZone.cmd') -Force
Copy-Item (Join-Path $sourceDir 'config.json') (Join-Path $targetDir 'config.json') -Force
Copy-Item (Join-Path $sourceDir 'app.ico') (Join-Path $targetDir 'app.ico') -Force

Write-Host '[3/3] กำลังสร้างไอคอนทางลัดบน Desktop...' -ForegroundColor Cyan
$WshShell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'อัปเดตทะเบียนคุม (ลากไฟล์วาง).lnk'
$cmdPath = Join-Path $targetDir 'Launch-DropZone.cmd'
$icoPath = Join-Path $targetDir 'app.ico'

$shortcut = $WshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $cmdPath
$shortcut.WorkingDirectory = $targetDir
$shortcut.Description = 'ก.พ.ค.ตร. - อัปเดตทะเบียนคุมด่วน (ลากไฟล์ Excel วางที่นี่)'
$shortcut.IconLocation = "$icoPath,0"
$shortcut.Save()

# Start menu shortcut
$startMenuDir = [System.IO.Path]::Combine($env:APPDATA, 'Microsoft\Windows\Start Menu\Programs')
$startShortcutPath = Join-Path $startMenuDir 'GPC อัปเดตทะเบียนคุม.lnk'
$startShortcut = $WshShell.CreateShortcut($startShortcutPath)
$startShortcut.TargetPath = $cmdPath
$startShortcut.WorkingDirectory = $targetDir
$startShortcut.Description = 'ก.พ.ค.ตร. - อัปเดตทะเบียนคุมด่วน'
$startShortcut.IconLocation = "$icoPath,0"
$startShortcut.Save()

Write-Host ''
Write-Host '========================================================' -ForegroundColor Green
Write-Host '  ติดตั้งโปรแกรมเรียบร้อยแล้ว!' -ForegroundColor Green
Write-Host "  ตำแหน่งไอคอน: $shortcutPath" -ForegroundColor Yellow
Write-Host '========================================================' -ForegroundColor Green

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show(
    "ติดตั้งโปรแกรมอัปเดตทะเบียนคุม ก.พ.ค.ตร. เรียบร้อยแล้ว!`n`n- พบไอคอน 'อัปเดตทะเบียนคุม (ลากไฟล์วาง)' บน Desktop`n- เพียงลากไฟล์ Excel ทะเบียนคุมวางทับไอคอน หรือดับเบิลคลิกเปิดหน้าต่างลากวาง เว็บจะอัปเดตทันที",
    "ติดตั้งสำเร็จ - ก.พ.ค.ตร.",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
) | Out-Null
