@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Chat AVG Gateway - Startup (Windows)
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] Starting API Gateway on port 8080...
echo.
echo ========================================
echo   System is LIVE. Press Ctrl+C to stop.
echo ========================================
echo.

node server.js

pause
