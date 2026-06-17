# Bettin2Win launcher — double-click the desktop icon to run this.
# Starts the odds-engine and the web app, then opens the dashboard in a browser.
$ErrorActionPreference = "Stop"

# Repo root is the parent of this /scripts folder.
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Bettin2Win ===" -ForegroundColor Green
Write-Host "Working folder: $root"

# 1. Install dependencies the first time (node_modules missing).
if (-not (Test-Path "$root\node_modules")) {
    Write-Host "First run: installing dependencies (one-time, a few minutes)..." -ForegroundColor Yellow
    npx -y pnpm@9.12.0 install
}

# 2. Build the odds-engine if it hasn't been compiled yet.
if (-not (Test-Path "$root\services\odds-engine\dist\index.js")) {
    Write-Host "Building the odds engine..." -ForegroundColor Yellow
    npx -y pnpm@9.12.0 --filter "@bettin2win/odds-engine" build
}

# 3. Start the engine in its own window (cwd = repo root so it loads .env keys).
Write-Host "Starting odds engine on http://localhost:4000 ..." -ForegroundColor Cyan
Start-Process powershell -WindowStyle Minimized -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root'; node services/odds-engine/dist/index.js"
)

# 4. Start the web dashboard in its own window.
Write-Host "Starting web dashboard on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -WindowStyle Minimized -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root'; npx -y pnpm@9.12.0 --filter '@bettin2win/web' dev"
)

# 5. Give the web server a moment to boot, then open the browser.
Write-Host "Opening the dashboard..." -ForegroundColor Cyan
Start-Sleep -Seconds 7
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Bettin2Win is running." -ForegroundColor Green
Write-Host "Two minimized PowerShell windows are doing the work — close them to stop the app."
Write-Host "You can close THIS window now."
