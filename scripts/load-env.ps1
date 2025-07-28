if (!(Test-Path ".env")) {
  Write-Host ".env file not found. Exiting..."
  exit 1
}
Write-Host "Environment loaded from .env"
$env:AWS_PROFILE = (Get-Content ".env" | Where-Object { $_ -match "^AWS_PROFILE=" }) -replace "AWS_PROFILE=", ""
$env:USER_INITIALS = (Get-Content ".env" | Where-Object { $_ -match "^USER_INITIALS=" }) -replace "USER_INITIALS=", ""
if (-not $env:AWS_PROFILE) {
  Write-Host "AWS_PROFILE not set in .env. Exiting..."
  exit 1
}
if (-not $env:USER_INITIALS) {
  Write-Host "USER_INITIALS not set in .env. Exiting..."
  exit 1
}