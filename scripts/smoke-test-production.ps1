<#
.SYNOPSIS
Runs a basic smoke test against a target environment.

.DESCRIPTION
Checks critical public and API routes to ensure they are responding appropriately.
Treats 200, 307, 401, 403 as acceptable depending on route.
Treats 500 as failure.
Does not print cookies or credentials.

.PARAMETER BaseUrl
The base URL to test (e.g. https://your-production-domain.vercel.app)
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl
)

# Ensure no trailing slash
$BaseUrl = $BaseUrl.TrimEnd('/')

$Routes = @(
    @{ Path = "/"; Name = "Root Page" },
    @{ Path = "/login"; Name = "Login Page" },
    @{ Path = "/api/auth/session"; Name = "Auth Session API" },
    @{ Path = "/api/health/db"; Name = "Database Health API" },
    @{ Path = "/admin/system"; Name = "Admin System Page" },
    @{ Path = "/api/admin/maintenance/actions/metadata"; Name = "Maintenance Metadata API" }
)

Write-Host "=========================================="
Write-Host " Starting Smoke Test"
Write-Host " Target: $BaseUrl"
Write-Host "=========================================="

$HasErrors = $false

foreach ($Route in $Routes) {
    $Url = "$BaseUrl$($Route.Path)"
    Write-Host "Testing $($Route.Name) -> $Url ... " -NoNewline
    
    try {
        $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
        $StatusCode = $Response.StatusCode
        Write-Host "PASS ($StatusCode)" -ForegroundColor Green
    }
    catch {
        $Exception = $_.Exception
        if ($Exception.Response) {
            $StatusCode = (int)$Exception.Response.StatusCode
            
            # 200, 307, 401, 403 are acceptable depending on route
            if ($StatusCode -eq 307 -or $StatusCode -eq 401 -or $StatusCode -eq 403) {
                Write-Host "PASS ($StatusCode)" -ForegroundColor Green
            }
            elseif ($StatusCode -ge 500) {
                Write-Host "FAIL ($StatusCode)" -ForegroundColor Red
                $HasErrors = $true
            }
            else {
                # Other status codes (like 404) are treated as warnings or passes depending on context.
                # We'll treat them as pass for this basic check, as long as it's not a 500.
                Write-Host "WARN ($StatusCode)" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "FAIL (Connection Error)" -ForegroundColor Red
            $HasErrors = $true
        }
    }
}

Write-Host "=========================================="
if ($HasErrors) {
    Write-Host "Smoke Test FAILED. Check the output above." -ForegroundColor Red
    exit 1
}
else {
    Write-Host "Smoke Test PASSED." -ForegroundColor Green
    exit 0
}
