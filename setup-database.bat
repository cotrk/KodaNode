@echo off
setlocal EnableDelayedExpansion
title Grimoire — Database Setup

echo.
echo ============================================================
echo   GRIMOIRE — Database Setup
echo   Connects to your local PostgreSQL and creates the database
echo ============================================================
echo.

REM ── Find psql.exe ─────────────────────────────────────────
echo [1/4] Looking for PostgreSQL (psql)...
set PSQL_EXE=

REM Check if psql is already in PATH
where psql >nul 2>&1
if %errorlevel% equ 0 (
    set PSQL_EXE=psql
    for /f "tokens=*" %%v in ('psql --version 2^>^&1') do set PSQL_VER=%%v
    echo  OK  Found in PATH: !PSQL_VER!
    goto :psql_found
)

REM Search common PostgreSQL install locations
for /d %%d in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%d\bin\psql.exe" (
        set PSQL_EXE=%%d\bin\psql.exe
        for /f "tokens=*" %%v in ('"%%d\bin\psql.exe" --version 2^>^&1') do set PSQL_VER=%%v
        echo  OK  Found at: %%d\bin\psql.exe
        echo      !PSQL_VER!
        goto :psql_found
    )
)

echo.
echo  ERROR: PostgreSQL (psql.exe) not found.
echo.
echo  Make sure PostgreSQL is installed. Download from:
echo    https://www.postgresql.org/download/windows
echo.
echo  If it is installed, add it to your PATH:
echo    1. Search for "Environment Variables" in the Start menu
echo    2. Edit the PATH variable and add:
echo       C:\Program Files\PostgreSQL\18\bin
echo       (replace 18 with your PostgreSQL version number)
echo.
pause
exit /b 1

:psql_found

REM ── Get credentials from user ─────────────────────────────
echo.
echo [2/4] PostgreSQL credentials
echo.
echo  Your PostgreSQL username is almost always:  postgres
echo  (This is the admin account created during installation)
echo.
set /p PG_USER="  Enter PostgreSQL username [press Enter for 'postgres']: "
if "!PG_USER!"=="" set PG_USER=postgres

echo.
echo  Enter your PostgreSQL password.
echo  (This is the password you set when installing PostgreSQL)
echo  The cursor will not move while you type — that is normal.
echo.
set /p PG_PASS="  Password: "

REM ── Test the connection ───────────────────────────────────
echo.
echo [3/4] Testing connection to PostgreSQL...
echo.
set PGPASSWORD=!PG_PASS!
"!PSQL_EXE!" -U !PG_USER! -h localhost -c "\q" >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Could not connect to PostgreSQL.
    echo.
    echo  Check:
    echo    - Is the password correct?
    echo    - Is PostgreSQL running? Open Services and look for postgresql-x64-18
    echo    - Is your username correct?
    echo.
    set PGPASSWORD=
    pause
    exit /b 1
)
echo  OK  Connected to PostgreSQL as [!PG_USER!]

REM ── Pick database name ────────────────────────────────────
echo.
echo  Choose a name for the Grimoire database.
echo  This will be created fresh — use any name you like.
echo.
set /p DB_NAME="  Database name [press Enter for 'grimoire']: "
if "!DB_NAME!"=="" set DB_NAME=grimoire

REM ── Check if database already exists ─────────────────────
"!PSQL_EXE!" -U !PG_USER! -h localhost -lqt 2>nul | findstr /C:" !DB_NAME! " >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo  Database [!DB_NAME!] already exists.
    set /p EXISTING="  Use the existing database? (Y/N): "
    if /i "!EXISTING!"=="N" (
        set /p DB_NAME="  Enter a different database name: "
    )
) else (
    echo.
    echo  Creating database [!DB_NAME!]...
    "!PSQL_EXE!" -U !PG_USER! -h localhost -c "CREATE DATABASE !DB_NAME!;" >nul 2>&1
    if %errorlevel% neq 0 (
        echo  ERROR: Could not create database [!DB_NAME!].
        echo  It may already exist or you may not have permission.
        set PGPASSWORD=
        pause
        exit /b 1
    )
    echo  OK  Database [!DB_NAME!] created.
)

REM ── Write DATABASE_URL to .env ────────────────────────────
echo.
echo [4/4] Saving connection string to .env...

set DB_URL=postgresql://!PG_USER!:!PG_PASS!@localhost:5432/!DB_NAME!

REM Read current .env, replace DATABASE_URL line
if exist .env (
    powershell -NoProfile -Command ^
        "$env = Get-Content (Join-Path '%CD%' '.env') -Encoding UTF8; " ^
        "$env = $env | ForEach-Object { if ($_ -match '^DATABASE_URL=') { 'DATABASE_URL=!DB_URL!' } else { $_ } }; " ^
        "Set-Content (Join-Path '%CD%' '.env') -Value $env -Encoding ASCII"
) else (
    powershell -NoProfile -Command ^
        "$lines = @('DATABASE_URL=!DB_URL!','SESSION_SECRET=change-me-to-a-long-random-secret'); " ^
        "Set-Content (Join-Path '%CD%' '.env') -Value $lines -Encoding ASCII"
)

REM Clear password from environment
set PGPASSWORD=

if exist .env (
    echo  OK  .env updated with:
    echo      DATABASE_URL=postgresql://!PG_USER!:***@localhost:5432/!DB_NAME!
) else (
    echo  ERROR: Could not write to .env
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Database setup complete!
echo.
echo   Connected as:  !PG_USER!
echo   Database:      !DB_NAME!
echo   Host:          localhost:5432
echo.
echo   NEXT STEP: Run start.bat to launch Grimoire.
echo   (start.bat will sync the schema tables automatically)
echo ============================================================
echo.
pause
