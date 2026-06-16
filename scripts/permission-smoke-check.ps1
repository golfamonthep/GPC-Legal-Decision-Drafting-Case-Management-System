param (
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

$routes = @(
    @{ Path = "/login"; ExpectedType = "public" },
    @{ Path = "/api/auth/session"; ExpectedType = "public" },
    @{ Path = "/admin/system"; ExpectedType = "protected" },
    @{ Path = "/api/admin/users"; ExpectedType = "protected" },
    @{ Path = "/api/rag/qa"; ExpectedType = "protected"; Method = "POST" },
    @{ Path = "/api/rag/retrieval"; ExpectedType = "protected"; Method = "POST" },
    @{ Path = "/library"; ExpectedType = "protected" },
    @{ Path = "/dashboard"; ExpectedType = "protected" }
)

Write-Host "Starting unauthenticated permission smoke check against $BaseUrl" -ForegroundColor Cyan

$passCount = 0
$failCount = 0

foreach ($route in $routes) {
    $url = "$BaseUrl$($route.Path)"
    $method = if ($route.Method) { $route.Method } else { "GET" }
    
    Write-Host "Testing [$method] $url ..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method $method -MaximumRedirection 0 -ErrorAction SilentlyContinue -SkipHttpErrorCheck
        $statusCode = $response.StatusCode
    } catch {
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        } else {
            Write-Host " FAIL (Connection Error)" -ForegroundColor Red
            $failCount++
            continue
        }
    }

    if ($statusCode -eq 500) {
        Write-Host " FAIL (500 Server Error)" -ForegroundColor Red
        $failCount++
        continue
    }

    if ($route.ExpectedType -eq "public") {
        if ($statusCode -eq 200) {
            Write-Host " PASS ($statusCode)" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host " FAIL (Expected 200, got $statusCode)" -ForegroundColor Red
            $failCount++
        }
    } elseif ($route.ExpectedType -eq "protected") {
        if ($statusCode -eq 401 -or $statusCode -eq 403 -or $statusCode -eq 307 -or $statusCode -eq 302 -or $statusCode -eq 308) {
            Write-Host " PASS ($statusCode)" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host " FAIL (Expected 401/403/307, got $statusCode)" -ForegroundColor Red
            $failCount++
        }
    }
}

Write-Host ""
Write-Host "Smoke Test Results:"
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
