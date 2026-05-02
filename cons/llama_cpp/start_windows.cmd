@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Llama.cpp Backend - Startup (Windows)
echo ========================================
echo.

cd /d "%~dp0"

:: 1. Detect CPU Cores
set /a CORES=%NUMBER_OF_PROCESSORS%
echo [INFO] Detected %CORES% logical cores.

:: 2. Set optimized threads based on core count
if %CORES% GTR 8 (
    set "THREADS=8"
    set "MODE=SERVER (Performance)"
) else (
    set "THREADS=4"
    set "MODE=LAPTOP (Balanced)"
)

echo [MODE] %MODE%
echo [INFO] Using %THREADS% threads for Llama.

:: 3. Find Model File
set "MODEL_PATH="
for /f "delims=" %%i in ('dir /b /s "models_cache\gemma-4-E2B-it-Q8_0.gguf" 2^>nul') do set "MODEL_PATH=%%i"

if "%MODEL_PATH%"=="" (
    echo [ERROR] Model gemma-4-E2B-it-Q8_0.gguf not found in models_cache!
    pause
    exit /b 1
)

:: 4. Start Llama Backend (Port 8081)
echo [INFO] Starting Llama Backend on port 8081...
echo.
echo ========================================
echo   Llama Backend is LIVE. Press Ctrl+C to stop.
echo ========================================
echo.

"llama-server.exe" -m "%MODEL_PATH%" -c 8192 -t %THREADS% -b 512 --mlock --host 127.0.0.1 --port 8081

pause
