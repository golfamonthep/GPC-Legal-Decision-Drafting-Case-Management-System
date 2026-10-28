@echo off
setlocal
echo กำลังถอนการติดตั้งโปรแกรมอัปเดตทะเบียนคุม...
del "%USERPROFILE%\Desktop\อัปเดตทะเบียนคุม (ลากไฟล์วาง).lnk" 2>nul
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\GPC อัปเดตทะเบียนคุม.lnk" 2>nul
rmdir /s /q "%LOCALAPPDATA%\GPC_Registry_Updater" 2>nul
echo ถอนการติดตั้งเรียบร้อยแล้ว
pause
