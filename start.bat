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

REM Use PowerShell to parse .env — handles UTF-8 BOM correctly
powershell -NoProfile -Command "Get-Content (Join-Path '%CD%' '.env') | Where-Object { $_ -match '^\s*[^#].+=' } | ForEach-Object { 'SET ' + $_ } | Set-Content '%TEMP%\grimoire_env.bat' -Encoding ASCII"

if exist "%TEMP%\grimoire_env.bat" (
    call "%TEMP%\grimoire_env.bat"
    del "%TEMP%\grimoire_env.bat" >nul 2>&1
) else (
    echo  WARN: Could not parse .env — trying fallback method...
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if not "%%a"=="" set "%%a=%%b"
    )
)
set NODE_ENV=development

REM ── Verify DATABASE_URL is set ───────────────────────────
if "!DATABASE_URL!"=="" (
    echo.
    echo  ERROR: DATABASE_URL is not set in your .env file.
    echo.
    echo  Open .env and set it. For local PostgreSQL 18 it looks like:
    echo    DATABASE_URL=postgresql://postgres:YourPassword@localhost:5432/grimoire
    echo.
    echo  Make sure the 'grimoire' database exists. Create it by running:
    echo    psql -U postgres -c "CREATE DATABASE grimoire;"
    echo.
    start notepad.exe "%CD%\.env"
    pause
    exit /b 1
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
