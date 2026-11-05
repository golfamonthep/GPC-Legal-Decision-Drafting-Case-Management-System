#Requires -Version 5.1
<#
.SYNOPSIS
    ติดตั้งทางลัดเริ่มต้นอัตโนมัติ (Windows Startup & Desktop Shortcut)
    สำหรับระบบออโต้อัปเดตทะเบียนคุม ก.พ.ค.ตร.
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$WshShell = New-Object -ComObject WScript.Shell
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRootDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
if (-not (Test-Path "$appRootDir\package.json")) {
    $appRootDir = "C:\APP"
}

$vbsLauncher = Join-Path $scriptDir "Launch-AutoSync-Background.vbs"
$iconPath = Join-Path $appRootDir "public\favicon.ico"

# 1. Startup Folder (Starts silently when Windows user logs in)
$startupFolder = [Environment]::GetFolderPath('Startup')
$startupLnk = Join-Path $startupFolder "GPC-AutoSync.lnk"
$sc1 = $WshShell.CreateShortcut($startupLnk)
$sc1.TargetPath = "wscript.exe"
$sc1.Arguments = "`"$vbsLauncher`""
$sc1.WorkingDirectory = $scriptDir
$sc1.Description = "ก.พ.ค.ตร. - ระบบออโต้อัปเดตทะเบียนคุมอัตโนมัติ (เฝ้าตรวจไฟล์ใน OneDrive)"
if (Test-Path $iconPath) {
    $sc1.IconLocation = "$iconPath,0"
}
$sc1.Save()
Write-Host "✅ ติดตั้งทางลัดเริ่มต้นระบบ (Windows Startup): $startupLnk"

# 2. Desktop Shortcut
$desktopFolder = [Environment]::GetFolderPath('Desktop')
$desktopLnk = Join-Path $desktopFolder "ออโต้อัปเดตทะเบียนคุม ก.พ.ค.ตร..lnk"
$sc2 = $WshShell.CreateShortcut($desktopLnk)
$sc2.TargetPath = "wscript.exe"
$sc2.Arguments = "`"$vbsLauncher`""
$sc2.WorkingDirectory = $scriptDir
$sc2.Description = "ก.พ.ค.ตร. - เริ่มระบบออโต้อัปเดตทะเบียนคุมอัตโนมัติ"
if (Test-Path $iconPath) {
    $sc2.IconLocation = "$iconPath,0"
}
$sc2.Save()
Write-Host "✅ สร้างทางลัดบนหน้าจอเดสก์ท็อป: $desktopLnk"

# 3. OneDrive Folder Launcher
$oneDriveDir = "C:\Users\polic\OneDrive\04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์"
if (Test-Path -LiteralPath $oneDriveDir) {
    $oneDriveLnk = Join-Path $oneDriveDir "ออโต้อัปเดตทะเบียนคุม ก.พ.ค.ตร..lnk"
    $sc3 = $WshShell.CreateShortcut($oneDriveLnk)
    $sc3.TargetPath = "wscript.exe"
    $sc3.Arguments = "`"$vbsLauncher`""
    $sc3.WorkingDirectory = $scriptDir
    $sc3.Description = "ก.พ.ค.ตร. - เริ่มระบบออโต้อัปเดตทะเบียนคุมอัตโนมัติ"
    if (Test-Path $iconPath) {
        $sc3.IconLocation = "$iconPath,0"
    }
    $sc3.Save()
    Write-Host "✅ สร้างทางลัดในโฟลเดอร์ OneDrive: $oneDriveLnk"

    # Clean up any legacy .cmd files in OneDrive so only 1 single .lnk icon remains
    $legacyCmd1 = Join-Path $oneDriveDir "เริ่มทำงานระบบออโต้อัปเดตทะเบียนคุม.cmd"
    $legacyCmd2 = Join-Path $oneDriveDir "⚡ เริ่มทำงานระบบออโต้อัปเดตทะเบียนคุม.cmd"
    if (Test-Path -LiteralPath $legacyCmd1) { Remove-Item -LiteralPath $legacyCmd1 -Force -ErrorAction SilentlyContinue }
    if (Test-Path -LiteralPath $legacyCmd2) { Remove-Item -LiteralPath $legacyCmd2 -Force -ErrorAction SilentlyContinue }
}

Write-Host "`r`nการติดตั้งเสร็จสมบูรณ์ 100%! ระบบจะเริ่มทำงานอัตโนมัติเมื่อเปิดเครื่องคอมพิวเตอร์"
