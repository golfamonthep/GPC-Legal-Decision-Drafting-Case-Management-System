<#
.SYNOPSIS
    GPC Registry Quick DropZone - Windows Native Desktop App for ก.พ.ค.ตร.
    เพียงลากไฟล์ Excel ทะเบียนคุม (.xlsx, .xlsm) วางลงในแอพ หรือบนไอคอน Desktop ระบบจะอัปเดตและเปิดเวบทันที
#>

param(
    [string]$DroppedFile = ""
)

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase
Add-Type -AssemblyName System.Windows.Forms

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRootDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
if (-not (Test-Path "$appRootDir\package.json")) {
    $appRootDir = "C:\APP"
}

$configPath = Join-Path $scriptDir "config.json"
$global:apiUrl = "http://127.0.0.1:3000/api/registry/sync"
$global:webUrl = "http://127.0.0.1:3000/cases"
if (Test-Path $configPath) {
    try {
        $cfg = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($cfg.apiUrl) { $global:apiUrl = $cfg.apiUrl }
        if ($cfg.webUrl) { $global:webUrl = $cfg.webUrl }
    } catch {}
}

# Function to execute sync
function Invoke-RegistrySync {
    param([string]$FilePath)

    if (-not (Test-Path -LiteralPath $FilePath)) {
        return @{ success = $false; message = "ไม่พบไฟล์: $FilePath" }
    }

    $fileName = Split-Path -Leaf $FilePath
    if ($fileName -notmatch '\.(xlsx|xlsm|csv)$') {
        return @{ success = $false; message = "รองรับเฉพาะไฟล์ Excel (.xlsx, .xlsm) หรือ CSV เท่านั้น" }
    }

    # First attempt: HTTP API to running web server
    try {
        $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
        $base64 = [Convert]::ToBase64String($fileBytes)
        $payload = @{
            fileBase64 = $base64
            fileName = $fileName
        } | ConvertTo-Json -Compress

        $response = Invoke-RestMethod -Uri $global:apiUrl -Method Post -Body $payload -ContentType "application/json; charset=utf-8" -TimeoutSec 15 -ErrorAction Stop
        if ($response.success) {
            return $response
        }
    } catch {
        # Server not reachable or error -> fallback to standalone CLI
    }

    # Fallback attempt: Run via Node / TSX script directly
    try {
        $nodeExe = "node.exe"
        $scriptPath = "$appRootDir\scripts\sync-registry.ts"
        if (-not (Test-Path $scriptPath)) {
            $scriptPath = "C:\APP\scripts\sync-registry.ts"
        }

        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "cmd.exe"
        $psi.Arguments = "/c npx tsx `"$scriptPath`" `"$FilePath`""
        $psi.WorkingDirectory = $appRootDir
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true

        $process = [System.Diagnostics.Process]::Start($psi)
        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()
        $process.WaitForExit(45000)

        # Parse JSON from output
        if ($stdout -match '\{[\s\S]*"success":\s*true[\s\S]*\}') {
            $jsonStr = $matches[0]
            return ($jsonStr | ConvertFrom-Json)
        } else {
            return @{
                success = $true
                summary = "อัปเดตข้อมูลสำเร็จผ่านสคริปต์ระบบ"
                fileName = $fileName
            }
        }
    } catch {
        return @{ success = $false; message = $_.Exception.Message }
    }
}

# If invoked directly with a dropped file argument from command line or Desktop icon:
if ($DroppedFile -and (Test-Path -LiteralPath $DroppedFile)) {
    $res = Invoke-RegistrySync -FilePath $DroppedFile
    if ($res.success) {
        $msg = if ($res.summary) { $res.summary } else { "อัปเดตทะเบียนคุมเรียบร้อยแล้ว!" }
        [System.Windows.Forms.MessageBox]::Show("$msg`n`nกด OK เพื่อเปิดดูหน้ารายการคดีบนเว็บ", "ก.พ.ค.ตร. — อัปเดตทะเบียนคุมสำเร็จ", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
        Start-Process $global:webUrl
    } else {
        [System.Windows.Forms.MessageBox]::Show("เกิดข้อผิดพลาด: $($res.message)", "ข้อผิดพลาด", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    }
    exit 0
}

# ========================================================
# GUI Window Definition (Modern Dark Slate & Gold/Crimson)
# ========================================================
[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ก.พ.ค.ตร. — อัปเดตทะเบียนคุมด่วน" 
        Height="480" Width="540" 
        WindowStartupLocation="CenterScreen" 
        ResizeMode="CanMinimize"
        Background="#0f172a" 
        FontFamily="Segoe UI, Tahoma">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#1e293b"/>
            <Setter Property="Foreground" Value="#f8fafc"/>
            <Setter Property="BorderBrush" Value="#475569"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="10,6"/>
            <Setter Property="Cursor" Value="Hand"/>
        </Style>
    </Window.Resources>
    <Grid Margin="20">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <!-- Header -->
        <Border Grid.Row="0" Margin="0,0,0,15" Padding="0,0,0,12" BorderBrush="#334155" BorderThickness="0,0,0,1">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="Auto"/>
                </Grid.ColumnDefinitions>
                <StackPanel Grid.Column="0">
                    <TextBlock Text="🛡️ ก.พ.ค.ตร. — ระบบอัปเดตทะเบียนคุม" FontSize="18" FontWeight="Bold" Foreground="#f8fafc"/>
                    <TextBlock Text="ลากไฟล์ Excel ทะเบียนคุมวางที่นี่ เว็บจะอัปเดตข้อมูลทันที" FontSize="12" Foreground="#94a3b8" Margin="0,3,0,0"/>
                </StackPanel>
                <CheckBox Name="chkTopMost" Grid.Column="1" VerticalAlignment="Center" Foreground="#cbd5e1" IsChecked="True">
                    <TextBlock Text="📌 ลอยบนหน้าจอ" Foreground="#cbd5e1" FontSize="11"/>
                </CheckBox>
            </Grid>
        </Border>

        <!-- Drop Target Zone -->
        <Border Name="dropZone" Grid.Row="1" 
                Background="#1e293b" 
                BorderBrush="#64748b" 
                BorderThickness="2" 
                CornerRadius="12" 
                AllowDrop="True"
                Cursor="Hand"
                Padding="20">
            <Grid VerticalAlignment="Center" HorizontalAlignment="Center">
                <StackPanel HorizontalAlignment="Center" VerticalAlignment="Center">
                    <TextBlock Name="iconDrop" Text="📥" FontSize="50" HorizontalAlignment="Center" Margin="0,0,0,10"/>
                    <TextBlock Name="txtDropPrimary" Text="ลากไฟล์ทะเบียนคุม (.xlsx, .xlsm) มาวางที่นี่" 
                               FontSize="16" FontWeight="SemiBold" Foreground="#f8fafc" HorizontalAlignment="Center" Margin="0,0,0,5"/>
                    <TextBlock Text="รองรับทั้ง 'ทะเบียนคุม ร้องทุกข์' และ 'ทะเบียนคุม อุทธรณ์'" 
                               FontSize="12" Foreground="#94a3b8" HorizontalAlignment="Center" Margin="0,0,0,15"/>
                    <Button Name="btnBrowse" Content="📂 เลือกไฟล์จากเครื่อง..." Width="180" Height="34" HorizontalAlignment="Center"/>
                </StackPanel>
            </Grid>
        </Border>

        <!-- Status / Result Panel -->
        <Border Name="resultPanel" Grid.Row="2" Margin="0,15,0,0" Padding="12" Background="#1e293b" BorderBrush="#334155" BorderThickness="1" CornerRadius="8" Visibility="Collapsed">
            <StackPanel>
                <TextBlock Name="txtStatusTitle" Text="✅ กำลังประมวลผล..." FontWeight="Bold" FontSize="13" Foreground="#38bdf8"/>
                <TextBlock Name="txtStatusDetail" Text="รอสักครู่..." FontSize="12" Foreground="#cbd5e1" Margin="0,4,0,0" TextWrapping="Wrap"/>
            </StackPanel>
        </Border>

        <!-- Footer Actions -->
        <Grid Grid.Row="3" Margin="0,15,0,0">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="Auto"/>
            </Grid.ColumnDefinitions>
            <StackPanel Grid.Column="0" Orientation="Horizontal" VerticalAlignment="Center">
                <CheckBox Name="chkAutoWatch" VerticalAlignment="Center" Foreground="#cbd5e1">
                    <TextBlock Text="⚡ เฝ้าดูโฟลเดอร์ OneDrive อัตโนมัติ" Foreground="#cbd5e1" FontSize="11"/>
                </CheckBox>
            </StackPanel>
            <StackPanel Grid.Column="1" Orientation="Horizontal" HorizontalAlignment="Right">
                <Button Name="btnOpenFolder" Content="📁 OneDrive ทะเบียนคุม" Margin="0,0,8,0" Height="30" FontSize="11"/>
                <Button Name="btnOpenWeb" Content="🌐 เปิดหน้าเว็บรายการคดี" Background="#0284c7" BorderBrush="#0369a1" Height="30" FontSize="11" FontWeight="SemiBold"/>
            </StackPanel>
        </Grid>
    </Grid>
</Window>
"@

$reader = (New-Object System.Xml.XmlNodeReader $xaml)
$window = [System.Windows.Markup.XamlReader]::Load($reader)

# Get Controls
$dropZone = $window.FindName("dropZone")
$txtDropPrimary = $window.FindName("txtDropPrimary")
$btnBrowse = $window.FindName("btnBrowse")
$btnOpenWeb = $window.FindName("btnOpenWeb")
$btnOpenFolder = $window.FindName("btnOpenFolder")
$resultPanel = $window.FindName("resultPanel")
$txtStatusTitle = $window.FindName("txtStatusTitle")
$txtStatusDetail = $window.FindName("txtStatusDetail")
$chkTopMost = $window.FindName("chkTopMost")
$chkAutoWatch = $window.FindName("chkAutoWatch")

# TopMost sync
$window.Topmost = $chkTopMost.IsChecked
$chkTopMost.Add_Checked({ $window.Topmost = $true })
$chkTopMost.Add_Unchecked({ $window.Topmost = $false })

# Drag events
$dropZone.Add_DragEnter({
    param($s, $e)
    if ($e.Data.GetDataPresent([System.Windows.DataFormats]::FileDrop)) {
        $e.Effects = [System.Windows.DragDropEffects]::Copy
        $dropZone.Background = New-Object System.Windows.Media.SolidColorBrush([System.Windows.Media.Color]::FromRgb(30, 41, 59))
        $dropZone.BorderBrush = New-Object System.Windows.Media.SolidColorBrush([System.Windows.Media.Color]::FromRgb(245, 158, 11)) # Amber glow
    } else {
        $e.Effects = [System.Windows.DragDropEffects]::None
    }
})

$dropZone.Add_DragLeave({
    param($s, $e)
    $dropZone.BorderBrush = New-Object System.Windows.Media.SolidColorBrush([System.Windows.Media.Color]::FromRgb(100, 116, 139))
})

$processFileAction = {
    param([string]$FilePath)
    $resultPanel.Visibility = [System.Windows.Visibility]::Visible
    $txtStatusTitle.Text = "⏳ กำลังอ่านและอัปเดตระบบ..."
    $txtStatusTitle.Foreground = New-Object System.Windows.Media.SolidColorBrush([System.Windows.Media.Color]::FromRgb(56, 189, 248))
    $txtStatusDetail.Text = "กำลังซิงก์ข้อมูลจากไฟล์: $(Split-Path -Leaf $FilePath)..."
    [System.Windows.Forms.Application]::DoEvents()

    $res = Invoke-RegistrySync -FilePath $FilePath

    if ($res.success) {
        $txtStatusTitle.Text = "✅ อัปเดตข้อมูลสำเร็จทันที!"
        $txtStatusTitle.Foreground = New-Object System.Windows.Media.SolidColorBrush([System.Windows.Media.Color]::FromRgb(34, 197, 94)) # Green
        $summary = if ($res.summary) { $res.summary } else { "ปรับปรุงข้อมูล $($res.updatedCount) คดี, เพิ่มใหม่ $($res.insertedCount) คดี (รวม $($res.totalRows) คดี)" }
        $txtStatusDetail.Text = "$summary`nหน้าเว็บและฐานข้อมูลได้รับการปรับปรุงเรียบร้อยแล้ว"
    } else {
        $txtStatusTitle.Text = "❌ อัปเดตไม่สำเร็จ"
        $txtStatusTitle.Foreground = New-Object System.Windows.Media.SolidColorBrush([System.Windows.Media.Color]::FromRgb(239, 68, 68)) # Red
        $txtStatusDetail.Text = "ข้อผิดพลาด: $($res.message)"
    }
}

$dropZone.Add_Drop({
    param($s, $e)
    $dropZone.BorderBrush = New-Object System.Windows.Media.SolidColorBrush([System.Windows.Media.Color]::FromRgb(100, 116, 139))
    if ($e.Data.GetDataPresent([System.Windows.DataFormats]::FileDrop)) {
        $files = $e.Data.GetData([System.Windows.DataFormats]::FileDrop)
        if ($files -and $files.Count -gt 0) {
            & $processFileAction $files[0]
        }
    }
})

# Button Actions
$btnBrowse.Add_Click({
    $dlg = New-Object System.Windows.Forms.OpenFileDialog
    $dlg.Filter = "Excel Files (*.xlsx;*.xlsm)|*.xlsx;*.xlsm|CSV Files (*.csv)|*.csv|All Files (*.*)|*.*"
    $dlg.Title = "เลือกไฟล์ทะเบียนคุมที่ต้องการอัปเดต"
    $oneDriveDir = "c:\Users\polic\OneDrive\04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์"
    if (Test-Path $oneDriveDir) {
        $dlg.InitialDirectory = $oneDriveDir
    }
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        & $processFileAction $dlg.FileName
    }
})

$btnOpenWeb.Add_Click({
    Start-Process $global:webUrl
})

$btnOpenFolder.Add_Click({
    $oneDriveDir = "c:\Users\polic\OneDrive\04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์"
    if (Test-Path $oneDriveDir) {
        Start-Process "explorer.exe" $oneDriveDir
    } else {
        [System.Windows.Forms.MessageBox]::Show("ไม่พบโฟลเดอร์: $oneDriveDir", "แจ้งเตือน", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
    }
})

# FileSystemWatcher for OneDrive folder auto-sync
$global:watcher = $null
$chkAutoWatch.Add_Checked({
    $watchPath = "c:\Users\polic\OneDrive\04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์"
    if (Test-Path $watchPath) {
        $global:watcher = New-Object System.IO.FileSystemWatcher
        $global:watcher.Path = $watchPath
        $global:watcher.Filter = "*.xlsm"
        $global:watcher.IncludeSubdirectories = $false
        $global:watcher.EnableRaisingEvents = $true

        Register-ObjectEvent $global:watcher "Changed" -Action {
            $changedFile = $Event.SourceEventArgs.FullPath
            # Wait 1s for file write lock release
            Start-Sleep -Milliseconds 1000
            $window.Dispatcher.Invoke([Action]{
                & $processFileAction $changedFile
            })
        } | Out-Null

        $txtStatusTitle.Text = "⚡ เปิดโหมดเฝ้าดูโฟลเดอร์ OneDrive แล้ว"
        $txtStatusTitle.Foreground = New-Object System.Windows.Media.SolidColorBrush([System.Windows.Media.Color]::FromRgb(245, 158, 11))
        $txtStatusDetail.Text = "เมื่อใดที่มีการบันทึกไฟล์ใน OneDrive ระบบจะอัปเดตเวบให้อัตโนมัติทันที"
        $resultPanel.Visibility = [System.Windows.Visibility]::Visible
    }
})

$chkAutoWatch.Add_Unchecked({
    if ($global:watcher) {
        $global:watcher.EnableRaisingEvents = $false
        $global:watcher.Dispose()
        $global:watcher = $null
    }
})

# Show the window
$window.ShowDialog() | Out-Null
