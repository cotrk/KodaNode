@echo off
setlocal EnableDelayedExpansion
title Prompt Vault — Update

echo.
echo ============================================================
echo   PROMPT VAULT — Update
echo ============================================================
echo.

REM ── Check Node ────────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found. Run install.bat first.
    pause
    exit /b 1
)

REM ── Pull latest code (if git is available) ────────────────
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [1/2] Pulling latest changes from git...
    git pull
    if %errorlevel% neq 0 (
        echo  WARN: git pull failed. You may need to resolve conflicts manually.
    ) else (
        echo  OK  Code updated.
    )
) else (
    echo  NOTE: git not found. Skipping code update.
    echo        Download the latest version manually if needed.
)

REM ── Update dependencies ───────────────────────────────────
echo.
echo [2/2] Updating dependencies...
npm install
if %errorlevel% neq 0 (
    echo  ERROR: npm install failed.
    pause
    exit /b 1
)
echo  OK  Dependencies updated.

REM ── Push schema ──────────────────────────────────────────
echo.
echo  Syncing database schema...
npm run db:push
if %errorlevel% neq 0 (
    echo  WARN: Schema sync failed. Check your DATABASE_URL.
) else (
    echo  OK  Schema up to date.
)

echo.
echo ============================================================
echo   Update complete! Run start.bat to launch Prompt Vault.
echo ============================================================
echo.
pause
