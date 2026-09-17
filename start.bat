@echo off
setlocal
cd /d "%~dp0"
if not defined PORT set PORT=8765

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Install Node.js, then run start.bat again.
  pause
  exit /b 1
)

echo Freeing port %PORT% ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; if ($p -and $p.ProcessName -eq 'node') { Write-Host ('Stopping node PID ' + $p.Id); Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } }"
timeout /t 1 /nobreak >nul

node server.js
if errorlevel 1 (
  echo Failed to start the LAN server.
  pause
  exit /b 1
)
