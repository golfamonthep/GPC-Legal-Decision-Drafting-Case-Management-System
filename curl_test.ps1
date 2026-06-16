$routes = "/", "/login", "/dashboard", "/cases", "/finalization", "/dispatch", "/assignments", "/search", "/executive", "/data-quality", "/meetings", "/admin/readiness", "/api/health/db", "/api/integrations/microsoft/status"
foreach ($r in $routes) {
    $res = curl.exe -s -o NUL -w "%{http_code} %{redirect_url}\n" "http://localhost:3000$r"
    Write-Host "$r -> $res"
}
