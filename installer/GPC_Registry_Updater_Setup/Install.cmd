@echo off
setlocal
cd /d "%~dp0"
echo ========================================================
echo   GPC Registry Quick DropZone Installer
echo   ก.พ.ค.ตร. - โปรแกรมติดตั้งตัวอัปเดตทะเบียนคุม
echo ========================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install.ps1"
echo.
pause
