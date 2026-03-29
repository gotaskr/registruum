$source = Join-Path $PSScriptRoot "..\\.env.local.hosted-supabase"
$destination = Join-Path $PSScriptRoot "..\\.env.local"

Copy-Item -LiteralPath $source -Destination $destination -Force
Write-Host "Switched .env.local to hosted Supabase."
