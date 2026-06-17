param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "==========================================================="
Write-Host "Archive Execution Smoke Test"
Write-Host "==========================================================="
Write-Host "Testing BaseUrl: $BaseUrl"
Write-Host "Expected result: 401 Unauthorized or 403 Forbidden"
Write-Host "Do not use credentials for this test."

$Endpoint = "$BaseUrl/api/records-retention/archive/execute"
$Body = @{
    caseIds = @("dummy-id-1")
    reason = "Smoke test"
    confirmationPhrase = "ARCHIVE PILOT CASES"
} | ConvertTo-Json

try {
    $Response = Invoke-WebRequest -Uri $Endpoint -Method POST -Body $Body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "FAILED: Request succeeded unexpectedly." -ForegroundColor Red
    Write-Host "Status: $($Response.StatusCode)"
    exit 1
} catch {
    $StatusCode = $_.Exception.Response.StatusCode.value__
    if ($StatusCode -eq 401 -or $StatusCode -eq 403) {
        Write-Host "SUCCESS: Endpoint correctly rejected unauthenticated request (Status: $StatusCode)" -ForegroundColor Green
    } elseif ($StatusCode -eq 423) {
        Write-Host "SUCCESS: Endpoint blocked by environment gate (Status: 423)" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Unexpected error status ($StatusCode)" -ForegroundColor Red
        Write-Host $_.Exception.Message
        exit 1
    }
}
