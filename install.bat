@echo off
setlocal EnableDelayedExpansion
title Grimoire — First-Time Setup

echo.
echo ============================================================
echo   GRIMOIRE — First-Time Setup
echo   Running from: %CD%
echo ============================================================
echo.

REM ── Check Node.js ──────────────────────────────────────────
echo [1/3] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js is not installed.
    echo.
    echo  Install Node.js v18 or later from: https://nodejs.org/en/download
    echo  Choose the LTS version. After installing, run this file again.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  OK  Node.js %NODE_VER%

REM ── Install dependencies ───────────────────────────────────
echo.
echo [2/3] Installing dependencies (may take 1-3 minutes)...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm install failed. Check your internet connection and try again.
    echo.
    pause
    exit /b 1
)
echo.
echo  OK  Dependencies installed.

REM ── Create .env file ──────────────────────────────────────
echo.
echo [3/3] Creating environment file...
echo.
if exist .env (
    echo  .env already exists — skipping.
    echo  Edit it at: %CD%\.env
) else (
    powershell -NoProfile -Command "$lines = @('DATABASE_URL=postgresql://localhost:5432/grimoire','SESSION_SECRET=change-me-to-a-long-random-secret'); Set-Content -Path (Join-Path '%CD%' '.env') -Value $lines -Encoding ASCII"
    if exist .env (
        echo  OK  .env created at: %CD%\.env
    ) else (
        copy nul "%CD%\.env" >nul 2>&1
        powershell -NoProfile -Command "Add-Content -Path (Join-Path '%CD%' '.env') -Value 'DATABASE_URL=postgresql://localhost:5432/grimoire'"
        powershell -NoProfile -Command "Add-Content -Path (Join-Path '%CD%' '.env') -Value 'SESSION_SECRET=change-me-to-a-long-random-secret'"
        if exist .env (
            echo  OK  .env created.
        ) else (
            echo.
            echo  Could not create .env automatically.
            echo  Please manually create a file named  .env  in this folder:
            echo    %CD%
            echo  With this content:
            echo    DATABASE_URL=postgresql://localhost:5432/grimoire
            echo    SESSION_SECRET=change-me-to-a-long-random-secret
            echo.
            pause
        )
    )
)

REM ── Open .env in Notepad ──────────────────────────────────
echo.
echo  Opening .env in Notepad...
echo  Set DATABASE_URL to your PostgreSQL connection string.
echo  Free options: https://neon.tech  or  https://supabase.com
echo.
start notepad.exe "%CD%\.env"

echo.
echo ============================================================
echo   Setup complete!
echo.
echo   NEXT STEPS:
echo     1. Fill in DATABASE_URL in the Notepad window that just opened
echo     2. Save the file and close Notepad
echo     3. (Optional) Run setup-ollama.bat to set up local AI
echo     4. Run start.bat to launch Grimoire
echo ============================================================
echo.
pause
