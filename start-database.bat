@echo off
setlocal EnableDelayedExpansion
title Grimoire — Start Database

echo.
echo ============================================================
echo   GRIMOIRE — Start Database
echo   Ensures the PostgreSQL service is running before Grimoire
echo ============================================================
echo.

REM ── Find the PostgreSQL service name ──────────────────────
set PG_SERVICE=
for /f "tokens=*" %%s in ('powershell -NoProfile -Command "Get-Service -Name postgresql* -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Name" 2^>nul') do set PG_SERVICE=%%s

if "!PG_SERVICE!"=="" (
    echo  No PostgreSQL service found on this machine.
    echo.
    echo  If PostgreSQL is installed, make sure it was set up as a Windows service.
    echo  You can still try running start.bat — if DATABASE_URL is set correctly
    echo  and PostgreSQL is running another way, Grimoire may connect fine.
    echo.
    pause
    exit /b 1
)

REM ── Check current status ───────────────────────────────────
for /f "tokens=*" %%t in ('powershell -NoProfile -Command "Get-Service -Name '!PG_SERVICE!' | Select-Object -ExpandProperty Status" 2^>nul') do set PG_STATUS=%%t

if /i "!PG_STATUS!"=="Running" (
    echo  OK  PostgreSQL is already running.
    echo      Service: !PG_SERVICE!
    goto :done
)

REM ── Service is stopped — start it ─────────────────────────
echo  PostgreSQL service [!PG_SERVICE!] is stopped. Starting it...
echo.

REM Try without elevation first (works if user has service-start rights)
net start "!PG_SERVICE!" >nul 2>&1
if %errorlevel% equ 0 (
    echo  OK  Service started.
    goto :done
)

REM Elevation needed — request UAC prompt
echo  Requesting administrator permission to start the service...
powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c net start \"!PG_SERVICE!\" && timeout /t 1 /nobreak' -Verb RunAs -Wait" >nul 2>&1

REM Verify it actually started after elevation
for /f "tokens=*" %%t in ('powershell -NoProfile -Command "Get-Service -Name '!PG_SERVICE!' | Select-Object -ExpandProperty Status" 2^>nul') do set PG_STATUS=%%t

if /i "!PG_STATUS!"=="Running" (
    echo  OK  Service started.
    goto :done
)

echo.
echo  Could not start the PostgreSQL service automatically.
echo.
echo  Options:
echo    A. Right-click start-database.bat and choose "Run as administrator"
echo    B. Open Services (search Start menu ^> "Services"),
echo       find the PostgreSQL entry, right-click it, and choose Start.
echo    C. If PostgreSQL is set to start automatically, restart your PC.
echo.
pause
exit /b 1

:done
echo.

REM ── Check if .env has a DATABASE_URL set ──────────────────
if exist .env (
    findstr /i "^DATABASE_URL=postgresql" .env >nul 2>&1
    if %errorlevel% equ 0 (
        echo  OK  DATABASE_URL found in .env
    ) else (
        echo  NOTE: DATABASE_URL not configured in .env
        echo  Run setup-database.bat to set it up.
    )
) else (
    echo  NOTE: .env file not found. Run install.bat first.
)

echo.
echo ============================================================
echo   PostgreSQL is running. You can now launch start.bat.
echo ============================================================
echo.
pause
