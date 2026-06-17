param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "Running Archive Execution UI Smoke Check" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl" -ForegroundColor Cyan
Write-Host "NOTE: Testing UNAUTHENTICATED behavior only. No credentials used. No cookies." -ForegroundColor Yellow

$fails = 0

function Test-Endpoint {
    param([string]$Path, [string]$Method="GET", [string]$Body="")
    
    $url = "$BaseUrl$Path"
    Write-Host "Testing $Method $url..." -NoNewline
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $url -Method GET -MaximumRedirection 0 -ErrorAction Stop
            Write-Host " [FAIL: Returned 200 without auth]" -ForegroundColor Red
            $script:fails++
        } else {
            $response = Invoke-WebRequest -Uri $url -Method POST -Body $Body -ContentType "application/json" -MaximumRedirection 0 -ErrorAction Stop
            Write-Host " [FAIL: Returned 200 without auth]" -ForegroundColor Red
            $script:fails++
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 302 -or $statusCode -eq 303 -or $statusCode -eq 307 -or $statusCode -eq 308) {
            Write-Host " [PASS: Redirected ($statusCode)]" -ForegroundColor Green
        } elseif ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host " [PASS: Blocked ($statusCode)]" -ForegroundColor Green
        } elseif ($statusCode -eq 500) {
            Write-Host " [FAIL: Server Error (500)]" -ForegroundColor Red
            $script:fails++
        } else {
            Write-Host " [WARN: Unexpected status ($statusCode)]" -ForegroundColor Yellow
            $script:fails++
        }
    }
}

Test-Endpoint -Path "/records-retention" -Method "GET"
Test-Endpoint -Path "/api/records-retention/archive/environment" -Method "GET"
Test-Endpoint -Path "/api/records-retention/archive/preview" -Method "POST" -Body '{"caseIds": ["dummy-case-id"], "reason": "test"}'
Test-Endpoint -Path "/api/records-retention/archive/execute" -Method "POST" -Body '{"caseIds": ["dummy-case-id"], "reason": "test", "confirmationPhrase": "ARCHIVE PILOT CASES"}'

if ($fails -eq 0) {
    Write-Host "Archive Execution UI smoke test PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Archive Execution UI smoke test FAILED with $fails errors." -ForegroundColor Red
    exit 1
}
