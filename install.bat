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
    echo  Creating .env file using PowerShell...
    powershell -NoProfile -Command "$content = @('DATABASE_URL=postgresql://localhost:5432/promptvault', 'SESSION_SECRET=change-me-to-a-long-random-string'); Set-Content -Path '.env' -Value $content -Encoding UTF8"
    if exist .env (
        echo  OK  .env created at: %CD%\.env
    ) else (
        echo.
        echo  Auto-create failed. Creating manually now...
        copy nul .env >nul 2>&1
        powershell -NoProfile -Command "Add-Content -Path '.env' -Value 'DATABASE_URL=postgresql://localhost:5432/promptvault'"
        powershell -NoProfile -Command "Add-Content -Path '.env' -Value 'SESSION_SECRET=change-me-to-a-long-random-string'"
        if exist .env (
            echo  OK  .env created successfully.
        ) else (
            echo.
            echo  ============================================================
            echo  MANUAL STEP REQUIRED:
            echo  Create a new text file in this folder: %CD%
            echo  Name it exactly:  .env  (with the dot, no .txt extension)
            echo  Paste this inside it:
            echo.
            echo    DATABASE_URL=postgresql://localhost:5432/promptvault
            echo    SESSION_SECRET=change-me-to-a-long-random-string
            echo  ============================================================
            echo.
        )
    )
)
echo.
pause

REM ── Open .env for editing ─────────────────────────────────
echo.
echo  Opening .env in Notepad so you can fill in your DATABASE_URL...
echo  Replace the DATABASE_URL value with your real PostgreSQL connection.
echo  Free databases: neon.tech or supabase.com
echo.
start notepad.exe "%CD%\.env"
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
