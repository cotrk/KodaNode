@echo off
setlocal EnableDelayedExpansion
title Prompt Vault — Starting...

echo.
echo ============================================================
echo   PROMPT VAULT — Starting
echo ============================================================
echo.

REM ── Check Node.js ──────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found. Run install.bat first.
    pause
    exit /b 1
)

REM ── Check node_modules ────────────────────────────────────
if not exist node_modules (
    echo  node_modules not found. Running install first...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo  ERROR: Install failed. Check your internet connection.
        pause
        exit /b 1
    )
)

REM ── Check .env ────────────────────────────────────────────
if not exist .env (
    echo  ERROR: .env file not found.
    echo  Run install.bat first to create it, then fill in your DATABASE_URL.
    pause
    exit /b 1
)

REM ── Check Ollama (optional, warn only) ────────────────────
echo  Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo  WARN: Ollama does not appear to be running.
    echo        AI Assistant and generation features will be unavailable.
    echo        Run setup-ollama.bat to get set up.
    echo.
) else (
    echo  OK   Ollama is running.
)

REM ── Push DB schema ────────────────────────────────────────
echo  Syncing database schema...
npm run db:push >nul 2>&1
if %errorlevel% neq 0 (
    echo  WARN: Schema sync failed. Check your DATABASE_URL in .env.
    echo        The app may not work correctly until this is resolved.
    echo.
)

REM ── Start the server ──────────────────────────────────────
echo.
echo  Starting Prompt Vault on http://localhost:5000
echo  Opening Chrome...
echo.
echo  Press Ctrl+C in this window to stop the server.
echo ============================================================
echo.

REM Open Chrome after a short delay
start "" timeout /t 3 /nobreak >nul && start chrome http://localhost:5000

REM Start the dev server
npm run dev
