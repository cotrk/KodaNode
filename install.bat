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
    REM Write a temp PowerShell script to create the .env template
    REM (avoids batch-escaping issues with #, ://, ?, = characters)
    set PS_SCRIPT=%TEMP%\grimoire_mkenv.ps1
    (
        echo $lines = @(
        echo   '# ================================================================',
        echo   '# GRIMOIRE - Environment Configuration',
        echo   '# ================================================================',
        echo   '# Uncomment ONE database option below and fill in your credentials.',
        echo   '# Run setup-database.bat to configure local PostgreSQL automatically.',
        echo   '# ================================================================',
        echo   '',
        echo   '# ----------------------------------------------------------------',
        echo   '# OPTION 1 - Local PostgreSQL',
        echo   '# Run setup-database.bat to fill this in automatically, OR edit:',
        echo   '#   Username and password = set during PostgreSQL installation',
        echo   '#   Database name         = any name you like (create it in pgAdmin)',
        echo   '# ----------------------------------------------------------------',
        echo   'DATABASE_URL=postgresql://postgres:YourPasswordHere@localhost:5432/grimoire',
        echo   '',
        echo   '# ----------------------------------------------------------------',
        echo   '# OPTION 2 - Supabase  https://supabase.com  (free tier available)',
        echo   '#   1. Create a project at supabase.com',
        echo   '#   2. Project Settings ^> Database ^> Connection String ^> URI',
        echo   '#   3. Paste the URI below and uncomment, comment out OPTION 1',
        echo   '# ----------------------------------------------------------------',
        echo   '# DATABASE_URL=postgresql://postgres:YourPassword@db.xxxxxxxxxxxxxxxxxxxx.supabase.co:5432/postgres',
        echo   '',
        echo   '# ----------------------------------------------------------------',
        echo   '# OPTION 3 - Neon  https://neon.tech  (free serverless PostgreSQL)',
        echo   '#   1. Create a project at neon.tech',
        echo   '#   2. Copy the Connection String from the dashboard',
        echo   '#   3. Paste it below and uncomment, comment out OPTION 1',
        echo   '# ----------------------------------------------------------------',
        echo   '# DATABASE_URL=postgresql://user:password@ep-name-abc123.us-east-2.aws.neon.tech/neondb?sslmode=require',
        echo   '',
        echo   '# ----------------------------------------------------------------',
        echo   '# OPTION 4 - Railway  https://railway.app  (free tier available)',
        echo   '#   1. Create a PostgreSQL service in a Railway project',
        echo   '#   2. Open the service, go to Variables, copy DATABASE_URL',
        echo   '#   3. Paste it below and uncomment, comment out OPTION 1',
        echo   '# ----------------------------------------------------------------',
        echo   '# DATABASE_URL=postgresql://postgres:password@monorail.proxy.rlwy.net:12345/railway',
        echo   '',
        echo   '# ----------------------------------------------------------------',
        echo   '# OPTION 5 - Aiven  https://aiven.io  (free tier available)',
        echo   '#   1. Create a PostgreSQL service at aiven.io',
        echo   '#   2. Service Overview ^> copy the Service URI',
        echo   '#   3. Paste it below and uncomment, comment out OPTION 1',
        echo   '# ----------------------------------------------------------------',
        echo   '# DATABASE_URL=postgresql://user:password@pg-name.aivencloud.com:12345/defaultdb?sslmode=require',
        echo   '',
        echo   '# ================================================================',
        echo   '# Session secret - change this to any long random string you like',
        echo   '# ================================================================',
        echo   'SESSION_SECRET=change-me-to-a-long-random-secret'
        echo ^)
        echo Set-Content -Path (Join-Path '%CD%' '.env') -Value $lines -Encoding ASCII
    ) > "!PS_SCRIPT!"

    powershell -NoProfile -ExecutionPolicy Bypass -File "!PS_SCRIPT!"
    del "!PS_SCRIPT!" >nul 2>&1

    if exist .env (
        echo  OK  .env created at: %CD%\.env
    ) else (
        echo  WARNING: Could not create .env automatically.
        echo  Please create a file named .env manually in: %CD%
        echo  See README.md for the required format.
        pause
    )
)

echo.
echo ============================================================
echo   Setup complete!
echo.
echo   NEXT STEPS:
echo     1. Run setup-database.bat  ^<^<^< do this next
echo        Walks you through choosing a database provider,
echo        creates the database, and writes .env automatically.
echo.
echo     2. (Optional) Run setup-ollama.bat to set up local AI
echo.
echo     3. Run start.bat to launch Grimoire
echo ============================================================
echo.
pause
