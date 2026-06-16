param (
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl
)

# Remove trailing slash
$BaseUrl = $BaseUrl.TrimEnd('/')

Write-Host "Running Non-Secret UAT Route Check on $BaseUrl" -ForegroundColor Cyan
Write-Host "Testing Unauthenticated Routing Behavior..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------------"

$routes = @(
    "/",
    "/login",
    "/dashboard",
    "/cases",
    "/admin/system",
    "/admin/users",
    "/executive",
    "/finalization",
    "/dispatch",
    "/api/auth/session",
    "/api/health/db"
)

$results = @()
$failedCount = 0

foreach ($route in $routes) {
    $url = "$BaseUrl$route"
    try {
        # Using maximum redirection to follow logins
        $response = Invoke-WebRequest -Uri $url -Method Get -MaximumRedirection 0 -ErrorAction SilentlyContinue
        $statusCode = $response.StatusCode
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($null -eq $statusCode) {
            $statusCode = 500 # Assume failure if no status code
        }
    }

    $pass = $false
    $reason = ""

    if ($route -eq "/login" -and $statusCode -eq 200) {
        $pass = $true
        $reason = "Public route accessible"
    } elseif ($route -eq "/api/health/db" -and $statusCode -eq 200) {
        $pass = $true
        $reason = "Health check accessible"
    } elseif ($route -eq "/api/auth/session" -and $statusCode -eq 200) {
        $pass = $true
        $reason = "Session returns 200 (null/empty when unauthenticated)"
    } elseif ($statusCode -eq 401 -or $statusCode -eq 403 -or $statusCode -eq 307 -or $statusCode -eq 302 -or $statusCode -eq 303) {
        $pass = $true
        $reason = "Protected route blocked/redirected"
    } else {
        $pass = $false
        $reason = "Unexpected status code"
        $failedCount++
    }

    $statusColor = if ($pass) { "Green" } else { "Red" }
    $passText = if ($pass) { "PASS" } else { "FAIL" }

    Write-Host "[$passText] " -ForegroundColor $statusColor -NoNewline
    Write-Host "$route -> $statusCode ($reason)"
    
    $results += [PSCustomObject]@{
        Route = $route
        Status = $statusCode
        Result = $passText
    }
}

Write-Host "--------------------------------------------------------"
if ($failedCount -eq 0) {
    Write-Host "All unauthenticated route checks PASSED." -ForegroundColor Green
} else {
    Write-Host "$failedCount route checks FAILED. Review unexpected status codes." -ForegroundColor Red
}
