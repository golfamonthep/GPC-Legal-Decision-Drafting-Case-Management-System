param (
    [string]$BaseUrl = "http://localhost:3000"
)

$Endpoint = "$BaseUrl/api/records-retention/archive/preview"

Write-Host "Running unauthenticated smoke test for Archive Preview Endpoint..."
Write-Host "Endpoint: $Endpoint"
Write-Host "--------------------------------------------------------"

$Body = @{
    caseIds = @("dummy-case-1", "dummy-case-2")
    reason = "smoke test"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $Endpoint -Method POST -Body $Body -ContentType "application/json" -ErrorAction Stop
    
    # If we get a 200 OK without authentication, something is wrong with the permission guard.
    Write-Host "FAIL: Endpoint returned $($response.StatusCode) without authentication." -ForegroundColor Red
    exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "PASS: Unauthenticated access blocked with expected status $statusCode." -ForegroundColor Green
    } elseif ($statusCode -eq 500) {
        Write-Host "FAIL: Endpoint crashed with 500 Internal Server Error." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "WARNING: Unexpected status code $statusCode." -ForegroundColor Yellow
    }
}

Write-Host "--------------------------------------------------------"
Write-Host "Smoke test complete."
