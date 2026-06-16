$routes = @(
    "/",
    "/login",
    "/dashboard",
    "/cases",
    "/finalization",
    "/dispatch",
    "/assignments",
    "/search",
    "/executive",
    "/data-quality",
    "/meetings",
    "/admin/readiness",
    "/api/health/db",
    "/api/integrations/microsoft/status"
)

foreach ($route in $routes) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000$route" -MaximumRedirection 0 -ErrorAction SilentlyContinue
        Write-Host "$route - Status: $($response.StatusCode) - Location: $($response.Headers['Location'])"
    } catch {
        $response = $_.Exception.Response
        if ($response) {
            Write-Host "$route - Status: $($response.StatusCode) - Location: $($response.Headers['Location'])"
        } else {
            Write-Host "$route - Error: $($_.Exception.Message)"
        }
    }
}
