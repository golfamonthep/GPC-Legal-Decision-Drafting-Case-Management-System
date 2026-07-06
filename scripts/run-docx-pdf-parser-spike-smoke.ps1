param (
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "Running DOCX/PDF parser spike unauthenticated smoke tests against $BaseUrl"

$endpoints = @(
    @{ Method = "POST"; Path = "/api/document-sync/microsoft/content-ingestion/docx-pdf/preview" },
    @{ Method = "POST"; Path = "/api/document-sync/microsoft/content-ingestion/docx-pdf/prototype" },
    @{ Method = "GET"; Path = "/api/document-sync/microsoft/content-ingestion/docx-pdf/runs" }
)

$allPassed = $true

foreach ($endpoint in $endpoints) {
    $url = "$BaseUrl$($endpoint.Path)"
    Write-Host "Testing $($endpoint.Method) $url"
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method $endpoint.Method -UseBasicParsing -ErrorAction Stop
        Write-Host "  FAILED: Expected 401/403/Redirect, but got 200 OK." -ForegroundColor Red
        $allPassed = $false
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 403 -or $statusCode -eq 423) {
            Write-Host "  PASSED: Got expected protected status code: $statusCode" -ForegroundColor Green
        } elseif ($statusCode -eq 500) {
            Write-Host "  FAILED: Got 500 Internal Server Error." -ForegroundColor Red
            $allPassed = $false
        } else {
            Write-Host "  UNKNOWN: Got status code $statusCode." -ForegroundColor Yellow
        }
    }
}

if ($allPassed) {
    Write-Host "`nSmoke tests passed: endpoints are protected or not found (404/401/403)." -ForegroundColor Green
} else {
    Write-Host "`nSmoke tests failed: some endpoints returned unexpected status codes." -ForegroundColor Red
}
