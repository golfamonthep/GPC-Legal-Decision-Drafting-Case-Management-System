@echo off
setlocal
echo Stopping GPC Auto-Sync Agent...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*GPC-AutoSync-Agent.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host 'Stopped PID:' $_.ProcessId }"
echo Done.
pause
