param (
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl
)

Write-Host "Verifying Staging Environment Safety at $BaseUrl" -ForegroundColor Cyan

function Test-Endpoint {
    param (
        [string]$Path,
        [string]$Method = "GET",
        [string]$Body = $null
    )
    $Url = "$BaseUrl$Path"
    Write-Host "Testing $Method $Url..." -NoNewline
    
    try {
        $response = $null
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $Url -Method GET -SkipHttpErrorCheck -UseBasicParsing
        } elseif ($Method -eq "POST") {
            if ($Body) {
                $response = Invoke-WebRequest -Uri $Url -Method POST -Body $Body -ContentType "application/json" -SkipHttpErrorCheck -UseBasicParsing
            } else {
                $response = Invoke-WebRequest -Uri $Url -Method POST -SkipHttpErrorCheck -UseBasicParsing
            }
        }
        
        $statusCode = $response.StatusCode
        if ($statusCode -eq 500) {
            Write-Host " FAILED ($statusCode)" -ForegroundColor Red
            return $false
        } elseif ($statusCode -eq 401 -or $statusCode -eq 403 -or $statusCode -ge 300) {
            Write-Host " Expected Protected ($statusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host " OK ($statusCode)" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host " ERROR ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

$success = $true

$success = $success -and (Test-Endpoint -Path "/api/health/db")
$success = $success -and (Test-Endpoint -Path "/api/auth/session")

# Test environment endpoint
$envUrl = "$BaseUrl/api/records-retention/archive/environment"
Write-Host "Testing GET $envUrl..." -NoNewline
try {
    $envResponse = Invoke-WebRequest -Uri $envUrl -Method GET -SkipHttpErrorCheck -UseBasicParsing
    $envCode = $envResponse.StatusCode
    if ($envCode -eq 200) {
        $envJson = $envResponse.Content | ConvertFrom-Json
        Write-Host " OK ($envCode) - Status: $($envJson.status)" -ForegroundColor Green
    } else {
        Write-Host " Protected or Missing ($envCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " Error testing environment endpoint" -ForegroundColor Yellow
}

$dummyBody = '{"caseIds":["dummy-123"]}'
$success = $success -and (Test-Endpoint -Path "/api/records-retention/archive/preview" -Method "POST" -Body $dummyBody)

$executeBody = '{"caseIds":["dummy-123"], "reason":"smoke test", "confirmationPhrase":"ARCHIVE_BATCH"}'
$success = $success -and (Test-Endpoint -Path "/api/records-retention/archive/execute" -Method "POST" -Body $executeBody)

if ($success) {
    Write-Host "Environment validation completed. Protected routes responded correctly and no 500 errors encountered." -ForegroundColor Green
} else {
    Write-Host "Environment validation FAILED. Review errors above." -ForegroundColor Red
    exit 1
}
