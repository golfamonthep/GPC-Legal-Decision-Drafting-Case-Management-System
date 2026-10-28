$WshShell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "อัปเดตทะเบียนคุม (ลากไฟล์วาง).lnk"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cmdPath = Join-Path $scriptDir "Launch-DropZone.cmd"

$shortcut = $WshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $cmdPath
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "ก.พ.ค.ตร. - อัปเดตทะเบียนคุม (ลากไฟล์ Excel วางที่นี่เพื่ออัปเดตระบบทันที)"

$iconPath = "C:\APP\public\favicon.ico"
if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath,0"
}

$shortcut.Save()
Write-Host "Installed shortcut to $shortcutPath"
