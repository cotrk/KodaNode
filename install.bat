@echo off
setlocal EnableDelayedExpansion
title Prompt Vault — First-Time Setup

echo.
echo ============================================================
echo   PROMPT VAULT — First-Time Setup
echo ============================================================
echo.
echo  Running from: %CD%
echo.
pause

REM ── Check Node.js ──────────────────────────────────────────
echo.
echo [1/4] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js is not installed or not in PATH.
    echo.
    echo  Please install Node.js v18 or later from:
    echo    https://nodejs.org/en/download
    echo.
    echo  After installing Node.js, CLOSE this window and run install.bat again.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  OK  Node.js %NODE_VER% found.
echo.
pause

REM ── Check npm ──────────────────────────────────────────────
echo.
echo [2/4] Checking for npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: npm not found. Please reinstall Node.js.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
echo  OK  npm %NPM_VER% found.
echo.
pause

REM ── Install dependencies ───────────────────────────────────
echo.
echo [3/4] Installing dependencies...
echo  (This may take 1-3 minutes on first run. Please wait.)
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm install failed.
    echo  Check your internet connection and try again.
    echo.
    pause
    exit /b 1
)
echo.
echo  OK  Dependencies installed successfully.
echo.
pause

REM ── Create .env file ──────────────────────────────────────
echo.
echo [4/4] Setting up environment file...
echo.
if exist .env (
    echo  .env file already exists — skipping creation.
    echo  Location: %CD%\.env
) else (
    echo  Creating .env file at: %CD%\.env
    echo # Prompt Vault - Environment Configuration> .env
    echo.>> .env
    echo # PostgreSQL connection string>> .env
    echo # Get a free database at neon.tech or supabase.com>> .env
    echo # Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE>> .env
    echo DATABASE_URL=postgresql://localhost:5432/promptvault>> .env
    echo.>> .env
    echo # Session secret - change this to any random string>> .env
    echo SESSION_SECRET=change-me-to-a-long-random-string>> .env

    if exist .env (
        echo  OK  .env created successfully!
    ) else (
        echo.
        echo  WARNING: Could not create .env automatically.
        echo  Please create a file named exactly:  .env
        echo  In this folder:  %CD%
        echo  With this content:
        echo.
        echo    DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
        echo    SESSION_SECRET=any-random-string-here
        echo.
    )
)
echo.
pause

REM ── Open .env for editing ─────────────────────────────────
echo.
echo  Opening .env in Notepad so you can fill in your DATABASE_URL...
echo.
echo  Change DATABASE_URL to your actual PostgreSQL connection string.
echo  Free databases: neon.tech or supabase.com
echo.
start notepad.exe .env
echo.
pause

echo.
echo ============================================================
echo   Setup complete!
echo.
echo   NEXT STEPS:
echo     1. Fill in DATABASE_URL in the .env file (Notepad just opened)
echo     2. Run setup-ollama.bat to set up local AI (optional)
echo     3. Run start.bat to launch Prompt Vault
echo ============================================================
echo.
pause
