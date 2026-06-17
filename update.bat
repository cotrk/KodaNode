@echo off
setlocal EnableDelayedExpansion
title Grimoire — Update

echo.
echo ============================================================
echo   GRIMOIRE — Update
echo ============================================================
echo.

REM ── Check Node.js ─────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found. Run install.bat first.
    echo.
    pause
    exit /b 1
)

REM ── Pull latest code ──────────────────────────────────────
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [1/3] Pulling latest code...
    git pull
    if %errorlevel% neq 0 (
        echo  WARN: git pull failed. Resolve any conflicts and try again.
    ) else (
        echo  OK  Code updated.
    )
) else (
    echo [1/3] git not found — skipping code update.
    echo        Download the latest version manually from Replit if needed.
)

REM ── Update dependencies ───────────────────────────────────
echo.
echo [2/3] Updating dependencies...
call npm install
if %errorlevel% neq 0 (
    echo  ERROR: npm install failed.
    echo.
    pause
    exit /b 1
)
echo  OK  Dependencies up to date.

REM ── Sync database schema ─────────────────────────────────
echo.
echo [3/3] Syncing database schema...

REM Load .env for DATABASE_URL
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        set "LINE=%%a"
        if not "!LINE:~0,1!"=="#" if not "%%a"=="" set "%%a=%%b"
    )
)

call npm run db:push >nul 2>&1
if %errorlevel% neq 0 (
    echo  WARN: Schema sync failed. Check DATABASE_URL in .env.
) else (
    echo  OK  Database schema up to date.
)

echo.
echo ============================================================
echo   Update complete! Run start.bat to launch Grimoire.
echo ============================================================
echo.
pause
