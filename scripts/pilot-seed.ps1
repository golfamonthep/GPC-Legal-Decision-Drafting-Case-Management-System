param (
    [switch]$Confirm = $false
)

if ($Confirm) {
    $env:PILOT_SEED_CONFIRM="YES"
} else {
    $env:PILOT_SEED_DRY_RUN="true"
    if (-not $env:DATABASE_URL) {
        $env:DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
    }
}

npx tsx scripts/seed-pilot-data.ts
