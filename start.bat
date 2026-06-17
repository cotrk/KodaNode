@echo off
setlocal EnableDelayedExpansion
title Grimoire — Starting...

echo.
echo ============================================================
echo   GRIMOIRE — Starting
echo ============================================================
echo.

REM ── Check Node.js ──────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found.
    echo  Run install.bat first.
    echo.
    pause
    exit /b 1
)

REM ── Check node_modules ────────────────────────────────────
if not exist node_modules (
    echo  Dependencies not installed. Running install...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo  ERROR: Install failed. Check your internet connection.
        echo.
        pause
        exit /b 1
    )
    echo.
)

REM ── Check .env ────────────────────────────────────────────
if not exist .env (
    echo  ERROR: .env file not found.
    echo  Run install.bat first to create it, then add your DATABASE_URL.
    echo.
    pause
    exit /b 1
)

REM ── Load .env into Windows environment ───────────────────
echo  Loading configuration...
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    set "LINE=%%a"
    if not "!LINE:~0,1!"=="#" (
        if not "%%a"=="" set "%%a=%%b"
    )
)
set NODE_ENV=development

REM ── Verify DATABASE_URL is set ───────────────────────────
if "%DATABASE_URL%"=="" (
    echo.
    echo  ERROR: DATABASE_URL is not set in your .env file.
    echo  Open .env and add your PostgreSQL connection string.
    echo  Free databases: https://neon.tech  or  https://supabase.com
    echo.
    pause
    exit /b 1
)
if "%DATABASE_URL%"=="postgresql://localhost:5432/grimoire" (
    echo.
    echo  WARNING: DATABASE_URL is still set to the default placeholder.
    echo  You need a real PostgreSQL database. Edit your .env file.
    echo  Free databases: https://neon.tech  or  https://supabase.com
    echo.
    echo  Press any key to try starting anyway, or close this window to cancel.
    pause
)
echo  OK  Configuration loaded.

REM ── Sync database schema ─────────────────────────────────
echo  Syncing database schema...
call npm run db:push >nul 2>&1
if %errorlevel% neq 0 (
    echo  WARN: Schema sync failed. Check your DATABASE_URL in .env.
) else (
    echo  OK  Database ready.
)

REM ── Check Ollama (optional) ───────────────────────────────
echo  Checking Ollama...
curl -s --max-time 2 http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo  NOTE: Ollama is not running. AI features will be unavailable.
    echo        Run setup-ollama.bat to configure local AI.
) else (
    echo  OK  Ollama running.
)

REM ── Start server and open browser ─────────────────────────
echo.
echo  Starting Grimoire on http://localhost:5000
echo  The app will open in your browser automatically.
echo.
echo  Keep this window open while using the app.
echo  Press Ctrl+C to stop the server.
echo ============================================================
echo.

REM Open default browser after 3 seconds
powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 3; Start-Process 'http://localhost:5000'"

REM Run the server (Windows-compatible: set env vars first, then run tsx directly)
npx tsx server/index.ts
