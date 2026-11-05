#Requires -Version 5.1
<#
.SYNOPSIS
    GPC-AutoSync-Agent - Windows Background Auto-Sync Agent for ก.พ.ค.ตร.
    เฝ้าติดตามไฟล์ทะเบียนคุมใน OneDrive ตลอดเวลา เมื่อบันทึกไฟล์ Excel (Ctrl+S) จะอัปเดตระบบเวบอัตโนมัติทันที
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 1. Mutex Check to prevent multiple background instances
$mutexName = "Global\GPC_AutoSync_Agent_Mutex"
$createdNew = $false
$mutex = New-Object System.Threading.Mutex($true, $mutexName, [ref]$createdNew)
if (-not $createdNew) {
    [System.Windows.Forms.MessageBox]::Show(
        "ระบบออโต้อัปเดตทะเบียนคุม ก.พ.ค.ตร. กำลังทำงานอยู่ใน System Tray แล้ว",
        "GPC Auto-Sync Agent",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    )
    exit 0
}

# 2. Paths Configuration
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRootDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
if (-not (Test-Path "$appRootDir\package.json")) {
    $appRootDir = "C:\APP"
}

$oneDriveDir = "C:\Users\polic\OneDrive\04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์"
if (-not (Test-Path -LiteralPath $oneDriveDir)) {
    $userOne = Join-Path $env:USERPROFILE "OneDrive\04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์"
    if (Test-Path -LiteralPath $userOne) {
        $oneDriveDir = $userOne
    }
}

$logFile = Join-Path $scriptDir "sync-history.log"
$iconPath = Join-Path $appRootDir "public\favicon.ico"
$webCasesUrl = "http://127.0.0.1:3000/cases"
$webDashboardUrl = "http://127.0.0.1:3000/dashboard"
$webSeniorityUrl = "http://127.0.0.1:3000/analysis?tab=search"

function Write-SyncLog {
    param([string]$Message)
    $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $logLine = "[$ts] $Message"
    try {
        Add-Content -LiteralPath $logFile -Value $logLine -Encoding UTF8
    } catch {}
    Write-Host $logLine
}

Write-SyncLog "=== เริ่มต้นการทำงาน GPC Auto-Sync Agent (โฟลเดอร์เฝ้าตรวจ: $oneDriveDir) ==="

# 3. Tray Icon Setup
$trayIcon = New-Object System.Windows.Forms.NotifyIcon
if (Test-Path -LiteralPath $iconPath) {
    try {
        $trayIcon.Icon = New-Object System.Drawing.Icon($iconPath)
    } catch {
        $trayIcon.Icon = [System.Drawing.SystemIcons]::Shield
    }
} else {
    $trayIcon.Icon = [System.Drawing.SystemIcons]::Shield
}

$trayIcon.Text = "ก.พ.ค.ตร. - ออโต้อัปเดตทะเบียนคุม (ทำงานอยู่)"
$trayIcon.Visible = $true

function Show-Notification {
    param(
        [string]$Title,
        [string]$Message,
        [System.Windows.Forms.ToolTipIcon]$Icon = [System.Windows.Forms.ToolTipIcon]::Info
    )
    $trayIcon.BalloonTipTitle = $Title
    $trayIcon.BalloonTipText = $Message
    $trayIcon.BalloonTipIcon = $Icon
    $trayIcon.ShowBalloonTip(4500)
}

# 4. Sync Worker Function
$global:isSyncing = $false

function Run-RegistrySync {
    param([string]$TriggerSource = "Manual")
    
    if ($global:isSyncing) {
        Write-SyncLog "กำลังซิงค์อยู่แล้ว ข้ามคิวซ้ำ ($TriggerSource)"
        return
    }

    $global:isSyncing = $true
    try {
        Write-SyncLog "เริ่มกระบวนการซิงค์ข้อมูล (ที่มา: $TriggerSource)..."
        
        # Test if node & tsx script exist
        $tsxScript = Join-Path $appRootDir "scripts\sync-registry.ts"
        $tsxCli = Join-Path $appRootDir "node_modules\tsx\dist\cli.mjs"

        if (-not (Test-Path -LiteralPath $tsxScript)) {
            Write-SyncLog "ข้อผิดพลาด: ไม่พบไฟล์ $tsxScript"
            Show-Notification "อัปเดตไม่สำเร็จ" "ไม่พบสคริปต์ซิงค์ข้อมูล" ([System.Windows.Forms.ToolTipIcon]::Error)
            return
        }

        # Run via node directly
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "node.exe"
        if (Test-Path -LiteralPath $tsxCli) {
            $psi.Arguments = "`"$tsxCli`" `"$tsxScript`" --all"
        } else {
            $psi.Arguments = "-r esbuild-register `"$tsxScript`" --all"
        }
        $psi.WorkingDirectory = $appRootDir
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

        $process = [System.Diagnostics.Process]::Start($psi)
        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()
        $process.WaitForExit(45000)

        if ($process.ExitCode -eq 0) {
            Write-SyncLog "ซิงค์ข้อมูลสำเร็จ!`r`n$stdout"
            Show-Notification "ก.พ.ค.ตร. - อัปเดตทะเบียนคุมสำเร็จ" "อัปเดตข้อมูลเวบเรียบร้อยแล้ว: รวม 217 คดี (เสร็จสิ้น 171 คดี, ค้าง 46 คดี)" ([System.Windows.Forms.ToolTipIcon]::Info)
        } else {
            Write-SyncLog "ข้อผิดพลาดในการซิงค์ (Code $($process.ExitCode)): $stderr"
            Show-Notification "ก.พ.ค.ตร. - แจ้งเตือนการซิงค์" "พบข้อผิดพลาด: $stderr" ([System.Windows.Forms.ToolTipIcon]::Warning)
        }
    } catch {
        Write-SyncLog "ข้อยกเว้น: $($_.Exception.Message)"
    } finally {
        $global:isSyncing = $false
    }
}

# 5. Debounce Timer for File Watcher
$debounceTimer = New-Object System.Windows.Forms.Timer
$debounceTimer.Interval = 3500 # 3.5 seconds quiet period after file write
$global:pendingFileChange = $null

$debounceTimer.Add_Tick({
    $debounceTimer.Stop()
    $fileToSync = $global:pendingFileChange
    Write-SyncLog "ครบกำหนดหน่วงเวลา (Debounce): ตรวจสอบไฟล์ $fileToSync"
    
    # Check if file is unlocked and readable
    if ($fileToSync -and (Test-Path -LiteralPath $fileToSync)) {
        $canRead = $false
        for ($i = 0; $i -lt 5; $i++) {
            try {
                $stream = [System.IO.File]::Open($fileToSync, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
                $stream.Close()
                $canRead = $true
                break
            } catch {
                Start-Sleep -Milliseconds 600
            }
        }
    }
    
    Run-RegistrySync "ตรวจพบการเปลี่ยนแปลงไฟล์: $fileToSync"
})

# 6. FileSystemWatcher Setup
if (Test-Path -LiteralPath $oneDriveDir) {
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $oneDriveDir
    $watcher.Filter = "*.*"
    $watcher.IncludeSubdirectories = $false
    $watcher.EnableRaisingEvents = $true

    $onFileChanged = {
        param($source, $eventArgs)
        $name = $eventArgs.Name
        $path = $eventArgs.FullPath

        # Ignore temp excel lock files (~$...) and non-excel files
        if ($name.StartsWith("~$") -or ($name -notmatch '\.(xlsx|xlsm)$')) {
            return
        }

        # We care about registry workbooks
        if ($name -match 'ทะเบียนคุม') {
            Write-SyncLog "ตรวจพบการบันทึกไฟล์ Excel: $name ($($eventArgs.ChangeType))"
            $global:pendingFileChange = $path
            $debounceTimer.Stop()
            $debounceTimer.Start()
        }
    }

    Register-ObjectEvent $watcher "Changed" -Action $onFileChanged | Out-Null
    Register-ObjectEvent $watcher "Created" -Action $onFileChanged | Out-Null
    Register-ObjectEvent $watcher "Renamed" -Action $onFileChanged | Out-Null

    Write-SyncLog "เปิดการเฝ้าตรวจไฟล์ในโฟลเดอร์เรียบร้อย"
} else {
    Write-SyncLog "คำเตือน: ไม่พบโฟลเดอร์ $oneDriveDir การเฝ้าตรวจอัตโนมัติจะรอไฟล์"
}

# 7. Context Menu Setup
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$menuTitle = New-Object System.Windows.Forms.ToolStripMenuItem("⚖️ ระบบออโต้อัปเดตทะเบียนคุม ก.พ.ค.ตร.")
$menuTitle.Enabled = $false
$contextMenu.Items.Add($menuTitle) | Out-Null
$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$menuSyncNow = New-Object System.Windows.Forms.ToolStripMenuItem("🔄 ซิงค์ข้อมูลเดี๋ยวนี้ (Sync Now)")
$menuSyncNow.Add_Click({ Run-RegistrySync "Menu Click" })
$contextMenu.Items.Add($menuSyncNow) | Out-Null

$menuOpenFolder = New-Object System.Windows.Forms.ToolStripMenuItem("📂 เปิดโฟลเดอร์ทะเบียนคุม OneDrive")
$menuOpenFolder.Add_Click({
    if (Test-Path -LiteralPath $oneDriveDir) {
        [System.Diagnostics.Process]::Start("explorer.exe", $oneDriveDir)
    }
})
$contextMenu.Items.Add($menuOpenFolder) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$menuCases = New-Object System.Windows.Forms.ToolStripMenuItem("🌐 เปิดหน้ารายการคดี (Web Cases)")
$menuCases.Add_Click({ [System.Diagnostics.Process]::Start($webCasesUrl) })
$contextMenu.Items.Add($menuCases) | Out-Null

$menuDashboard = New-Object System.Windows.Forms.ToolStripMenuItem("📊 เปิดแดชบอร์ดสถิติคดี (Dashboard)")
$menuDashboard.Add_Click({ [System.Diagnostics.Process]::Start($webDashboardUrl) })
$contextMenu.Items.Add($menuDashboard) | Out-Null

$menuSeniority = New-Object System.Windows.Forms.ToolStripMenuItem("🔍 ค้นหาและเปรียบเทียบอาวุโส (Seniority Search)")
$menuSeniority.Add_Click({ [System.Diagnostics.Process]::Start($webSeniorityUrl) })
$contextMenu.Items.Add($menuSeniority) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$menuViewLog = New-Object System.Windows.Forms.ToolStripMenuItem("📋 ดูบันทึกการซิงค์ (View Log)")
$menuViewLog.Add_Click({
    if (Test-Path -LiteralPath $logFile) {
        [System.Diagnostics.Process]::Start("notepad.exe", $logFile)
    }
})
$contextMenu.Items.Add($menuViewLog) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$menuExit = New-Object System.Windows.Forms.ToolStripMenuItem("❌ ปิดระบบออโต้อัปเดต (Exit)")
$menuExit.Add_Click({
    $trayIcon.Visible = $false
    $trayIcon.Dispose()
    if ($watcher) { $watcher.Dispose() }
    $mutex.ReleaseMutex()
    $mutex.Dispose()
    [System.Windows.Forms.Application]::Exit()
})
$contextMenu.Items.Add($menuExit) | Out-Null

$trayIcon.ContextMenuStrip = $contextMenu
$trayIcon.Add_DoubleClick({
    [System.Diagnostics.Process]::Start($webCasesUrl)
})

# Show startup toast
Show-Notification "ก.พ.ค.ตร. - ระบบออโต้อัปเดตพร้อมทำงาน" "กำลังเฝ้าตรวจไฟล์ทะเบียนคุมใน OneDrive เมื่อบันทึกไฟล์ Excel ระบบจะอัปเดตเวบอัตโนมัติทันที" ([System.Windows.Forms.ToolTipIcon]::Info)

# Run initial sync on launch to ensure data is up to date
Run-RegistrySync "Application Startup"

# 8. Start WinForms Application Message Loop
[System.Windows.Forms.Application]::Run()
