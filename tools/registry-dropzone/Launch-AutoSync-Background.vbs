Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

appRoot = "C:\APP"
daemonScript = appRoot & "\scripts\auto-sync-daemon.mjs"
tsxCli = appRoot & "\node_modules\tsx\dist\cli.mjs"
syncScript = appRoot & "\scripts\sync-registry.ts"

WshShell.CurrentDirectory = appRoot

' 1. Ensure the background file-watcher daemon is running (single-instance via port 49876)
WshShell.Run "node.exe """ & daemonScript & """", 0, False

' 2. Run immediate sync and show confirmation popup (unless --quiet is passed)
isQuiet = False
If WScript.Arguments.Count > 0 Then
    If WScript.Arguments(0) = "--quiet" Then
        isQuiet = True
    End If
End If

If isQuiet Then
    WshShell.Run "node.exe """ & tsxCli & """ """ & syncScript & """ --all", 0, False
Else
    WshShell.Run "node.exe """ & tsxCli & """ """ & syncScript & """ --all --popup", 0, False
End If
