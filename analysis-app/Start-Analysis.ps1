$ErrorActionPreference='Stop'
$analysisRoot=$PSScriptRoot
$analysisNode='C:\Users\polic\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $analysisNode)) { $analysisNode=(Get-Command node.exe -ErrorAction Stop).Source }
if (-not (Test-Path -LiteralPath (Join-Path $analysisRoot 'dist\index.html'))) { throw 'ไม่พบ build ของแอป โปรดรัน npm run build ในโฟลเดอร์ analysis-app' }
try { $analysisHealth=Invoke-RestMethod -Uri 'http://127.0.0.1:4318/api/health' -TimeoutSec 2 } catch { $analysisHealth=$null }
if ($analysisHealth -and $analysisHealth.mode -eq 'analysis_only') { Write-Output 'เปิดใช้งานแล้วที่ http://127.0.0.1:4318'; exit }
$analysisState=Join-Path $analysisRoot '.state'
New-Item -ItemType Directory -Path $analysisState -Force | Out-Null
$analysisServer=Join-Path $analysisRoot 'server.mjs'
$analysisProc=Start-Process -FilePath $analysisNode -ArgumentList @($analysisServer,'--production') -WorkingDirectory $analysisRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $analysisState 'server.log') -RedirectStandardError (Join-Path $analysisState 'server-error.log') -PassThru
Set-Content -LiteralPath (Join-Path $analysisState 'server.pid') -Value $analysisProc.Id -Encoding ascii
Write-Output 'ระบบวิเคราะห์เปิดที่ http://127.0.0.1:4318'
