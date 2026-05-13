# Runs Stripe CLI from WinGet install when `stripe` is not on PATH (e.g. Cursor terminal).
$ErrorActionPreference = "Stop"
$packagesRoot = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
$stripeExe = Get-ChildItem -Path $packagesRoot -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like "Stripe.StripeCli*" } |
  ForEach-Object { Join-Path $_.FullName "stripe.exe" } |
  Where-Object { Test-Path $_ } |
  Select-Object -First 1

if (-not $stripeExe) {
  Write-Host "Stripe CLI not found under WinGet Packages." -ForegroundColor Red
  Write-Host "Install: winget install Stripe.StripeCli" -ForegroundColor Yellow
  Write-Host "Then restart Cursor (or add the Stripe folder to your User PATH)." -ForegroundColor Yellow
  exit 1
}

& $stripeExe @args
exit $LASTEXITCODE
