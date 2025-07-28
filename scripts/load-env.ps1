# load-env.ps1
$envLines = Get-Content ".env"
foreach ($line in $envLines) {
    if ($line -match "^\s*([^#][\w]+)\s*=\s*(.+)$") {
        $key = $matches[1]
        $value = $matches[2]
        Set-Item -Path "Env:$key" -Value $value
    }
}