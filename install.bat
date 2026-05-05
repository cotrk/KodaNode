@echo off
setlocal EnableDelayedExpansion
title Prompt Vault — First-Time Setup

echo.
echo ============================================================
echo   PROMPT VAULT — First-Time Setup
echo ============================================================
echo.

REM ── Check Node.js ──────────────────────────────────────────
echo [1/4] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js is not installed or not in PATH.
    echo.
    echo  Please install Node.js v18 or later from:
    echo    https://nodejs.org/en/download
    echo.
    echo  After installing, re-run this file.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  OK  Node.js %NODE_VER% found.

REM ── Check npm ──────────────────────────────────────────────
echo.
echo [2/4] Checking for npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: npm not found. Reinstall Node.js.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
echo  OK  npm %NPM_VER% found.

REM ── Install dependencies ───────────────────────────────────
echo.
echo [3/4] Installing dependencies (this may take a minute)...
echo.
npm install
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
)
echo.
echo  OK  Dependencies installed.

REM ── Check environment file ────────────────────────────────
echo.
echo [4/4] Checking environment configuration...
if not exist .env (
    echo.
    echo  NOTE: No .env file found.
    echo  Creating a template .env file for you...
    echo.
    (
        echo # Prompt Vault — Environment Configuration
        echo.
        echo # PostgreSQL connection string
        echo # Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
        echo DATABASE_URL=postgresql://localhost:5432/promptvault
        echo.
        echo # Session secret (change this to a random string)
        echo SESSION_SECRET=change-me-to-a-random-secret-string
    ) > .env
    echo  Created .env — open it and fill in your DATABASE_URL before starting.
    echo.
    echo  If you don't have PostgreSQL, you can get a free one at:
    echo    https://neon.tech  (cloud, free tier)
    echo    https://supabase.com  (cloud, free tier)
    echo    or install PostgreSQL locally: https://www.postgresql.org/download/windows
    echo.
) else (
    echo  OK  .env file found.
)

echo.
echo ============================================================
echo   Setup complete!
echo.
echo   Next steps:
echo     1. Edit .env and set your DATABASE_URL
echo     2. Run start.bat to launch Prompt Vault
echo     3. Run setup-ollama.bat to configure local AI
echo ============================================================
echo.
pause
