@echo off
echo ========================================
echo   Chat AVG - Auto Deployment Script
echo ========================================
echo.

:: 1. Pull latest code
echo [1/3] Pulling changes from Git...
git pull origin main
if %errorlevel% neq 0 (
    echo [ERROR] Git pull failed. Check your connection/permissions.
    pause
    exit /b %errorlevel%
)

:: 2. Update dependencies
echo [2/3] Updating Node.js dependencies...
cd chatavg
call npm install --production
cd ..

:: 3. Restart services
echo [3/3] Restarting services...
:: We kill the processes so the Windows Task Scheduler can restart them
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM llama-server.exe /T 2>nul

echo.
echo ========================================
echo   SUCCESS: Deployment Complete!
echo   Services will be restarted by 
echo   Windows Task Scheduler.
echo ========================================
pause
