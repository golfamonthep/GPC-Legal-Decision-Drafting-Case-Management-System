$ErrorActionPreference='Stop'
$bridgeWorkspace=Split-Path -Parent $PSScriptRoot
$bridgeNode='C:\Users\polic\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $bridgeNode)) { $bridgeNode=(Get-Command node.exe -ErrorAction Stop).Source }
& $bridgeNode (Join-Path $PSScriptRoot 'check-analysis-bridge-config.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& (Join-Path $bridgeWorkspace 'analysis-app\Start-Analysis.ps1')
$bridgeLogRoot=Join-Path $bridgeWorkspace 'analysis-app\.state'
try { $bridgeExisting=Invoke-WebRequest -Uri 'http://127.0.0.1:3000/api/health/db' -TimeoutSec 5 } catch { $bridgeExisting=$null }
if (-not $bridgeExisting) {
  $bridgePortInUse=Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($bridgePortInUse) { throw 'พอร์ต 3000 มีโปรแกรมเปิดอยู่แต่ health ของทะเบียนไม่ผ่าน กรุณาปิดหรือแก้โปรแกรมเดิมก่อนเปิดใหม่' }
  $bridgeProcess=Start-Process -FilePath $bridgeNode -ArgumentList @('node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3000') -WorkingDirectory $bridgeWorkspace -WindowStyle Hidden -RedirectStandardOutput (Join-Path $bridgeLogRoot 'registry-server.log') -RedirectStandardError (Join-Path $bridgeLogRoot 'registry-server-error.log') -PassThru
  Set-Content -LiteralPath (Join-Path $bridgeLogRoot 'registry-server.pid') -Value $bridgeProcess.Id -Encoding ascii
}
Write-Output 'ระบบทะเบียน: http://127.0.0.1:3000/cases'
Write-Output 'ส่วนวิเคราะห์: http://127.0.0.1:4318'
Write-Output 'เปิดสำหรับใช้งานในเครื่องเดียว ต้องตรวจ health และงานส่ง-รับก่อนใช้สำนวนจริง'
