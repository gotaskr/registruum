$source = Join-Path $PSScriptRoot "..\\.env.local.local-supabase"
$destination = Join-Path $PSScriptRoot "..\\.env.local"

Copy-Item -LiteralPath $source -Destination $destination -Force
Write-Host "Switched .env.local to local Supabase."
Write-Host "If sign-in cannot reach http://127.0.0.1:54321, run: npm run verify:local-supabase"
Write-Host "  (GoTrue JSON = stack OK inside Docker; otherwise restart Docker Desktop on Windows.)"
