@echo off
setlocal EnableDelayedExpansion
title Grimoire — Database Setup

echo.
echo ============================================================
echo   GRIMOIRE — Database Setup
echo ============================================================
echo.
echo   Choose your database provider:
echo.
echo     1. Local PostgreSQL     (already installed on this PC)
echo     2. Supabase             https://supabase.com
echo     3. Neon                 https://neon.tech
echo     4. Railway              https://railway.app
echo     5. Aiven                https://aiven.io
echo     6. Other / Manual       I have a connection string already
echo.
set /p DB_CHOICE="  Your choice (1-6): "

if "!DB_CHOICE!"=="1" goto :local_postgres
if "!DB_CHOICE!"=="2" goto :cloud_supabase
if "!DB_CHOICE!"=="3" goto :cloud_neon
if "!DB_CHOICE!"=="4" goto :cloud_railway
if "!DB_CHOICE!"=="5" goto :cloud_aiven
if "!DB_CHOICE!"=="6" goto :cloud_manual
echo  Invalid choice. Please run this file again and enter 1-6.
pause
exit /b 1

REM =============================================================
REM  CLOUD PROVIDERS — show instructions, open .env for editing
REM =============================================================

:cloud_supabase
echo.
echo ============================================================
echo   Supabase Setup
echo ============================================================
echo.
echo   1. Go to https://supabase.com and sign in / create an account
echo   2. Create a new Project
echo   3. Once created, go to:
echo        Project Settings ^> Database ^> Connection String ^> URI
echo   4. Copy the connection string (starts with postgresql://)
echo   5. Open your .env file (Notepad will open now)
echo   6. Find the Supabase line and:
echo        - Remove the  #  at the start to uncomment it
echo        - Paste your connection string after  DATABASE_URL=
echo        - Add a  #  at the start of the OPTION 1 line to comment it out
echo   7. Save the file, close Notepad, then run start.bat
echo.
echo   Your connection string will look like:
echo     postgresql://postgres:abc123@db.xxxxxxxxxxxxxxxx.supabase.co:5432/postgres
echo.
pause
goto :open_env_and_exit

:cloud_neon
echo.
echo ============================================================
echo   Neon Setup
echo ============================================================
echo.
echo   1. Go to https://neon.tech and sign in / create an account
echo   2. Create a new Project (choose a region near you)
echo   3. On the dashboard, click "Connection string" or go to:
echo        Project Dashboard ^> Connection Details
echo   4. Copy the connection string (starts with postgresql://)
echo   5. Open your .env file (Notepad will open now)
echo   6. Find the Neon line and:
echo        - Remove the  #  at the start to uncomment it
echo        - Paste your connection string after  DATABASE_URL=
echo        - Add a  #  at the start of the OPTION 1 line to comment it out
echo   7. Save the file, close Notepad, then run start.bat
echo.
echo   Your connection string will look like:
echo     postgresql://user:abc123@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
echo.
pause
goto :open_env_and_exit

:cloud_railway
echo.
echo ============================================================
echo   Railway Setup
echo ============================================================
echo.
echo   1. Go to https://railway.app and sign in / create an account
echo   2. Create a new Project
echo   3. Inside the project, click "+ New" ^> "Database" ^> "PostgreSQL"
echo   4. Click the PostgreSQL service ^> go to the "Variables" tab
echo   5. Copy the value of DATABASE_URL
echo   6. Open your .env file (Notepad will open now)
echo   7. Find the Railway line and:
echo        - Remove the  #  at the start to uncomment it
echo        - Paste your connection string after  DATABASE_URL=
echo        - Add a  #  at the start of the OPTION 1 line to comment it out
echo   8. Save the file, close Notepad, then run start.bat
echo.
echo   Your connection string will look like:
echo     postgresql://postgres:abc123@monorail.proxy.rlwy.net:12345/railway
echo.
pause
goto :open_env_and_exit

:cloud_aiven
echo.
echo ============================================================
echo   Aiven Setup
echo ============================================================
echo.
echo   1. Go to https://aiven.io and sign in / create an account
echo   2. Create a new PostgreSQL service (free tier available)
echo   3. Wait for the service to start, then click on it
echo   4. On the Overview page, copy the "Service URI"
echo   5. Open your .env file (Notepad will open now)
echo   6. Find the Aiven line and:
echo        - Remove the  #  at the start to uncomment it
echo        - Paste your connection string after  DATABASE_URL=
echo        - Add a  #  at the start of the OPTION 1 line to comment it out
echo   7. Save the file, close Notepad, then run start.bat
echo.
echo   Your connection string will look like:
echo     postgresql://user:abc123@pg-name.aivencloud.com:12345/defaultdb?sslmode=require
echo.
pause
goto :open_env_and_exit

:cloud_manual
echo.
echo ============================================================
echo   Manual Setup
echo ============================================================
echo.
echo   Your .env file will open in Notepad.
echo.
echo   Replace the DATABASE_URL value with your connection string.
echo   The format is:
echo     postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
echo.
echo   Make sure to comment out any option you are NOT using
echo   by adding a  #  at the start of that DATABASE_URL line.
echo.
pause
goto :open_env_and_exit

:open_env_and_exit
if not exist .env (
    echo  NOTE: .env file not found. Run install.bat first.
    pause
    exit /b 1
)
start notepad.exe "%CD%\.env"
echo.
echo  Notepad is open with your .env file.
echo  Edit DATABASE_URL, save, then run start.bat.
echo.
pause
exit /b 0


REM =============================================================
REM  LOCAL POSTGRESQL — full automated setup
REM =============================================================

:local_postgres
echo.
echo ============================================================
echo   Local PostgreSQL Setup
echo ============================================================
echo.

REM ── Find psql.exe ─────────────────────────────────────────
echo [1/4] Looking for PostgreSQL (psql)...
set PSQL_EXE=

where psql >nul 2>&1
if %errorlevel% equ 0 (
    set PSQL_EXE=psql
    for /f "tokens=*" %%v in ('psql --version 2^>^&1') do set PSQL_VER=%%v
    echo  OK  Found in PATH: !PSQL_VER!
    goto :psql_found
)

for /d %%d in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%d\bin\psql.exe" (
        set PSQL_EXE=%%d\bin\psql.exe
        for /f "tokens=*" %%v in ('"%%d\bin\psql.exe" --version 2^>^&1') do set PSQL_VER=%%v
        echo  OK  Found at: %%d\bin\psql.exe
        echo      !PSQL_VER!
        goto :psql_found
    )
)

REM ── psql not found — offer recovery options ───────────────
echo.
echo  PostgreSQL (psql.exe) was not found in PATH or C:\Program Files\PostgreSQL\
echo.
echo  What would you like to do?
echo.
echo    1. Enter the path to your PostgreSQL bin folder manually
echo       (e.g.  P:\PostgreSQL\18\bin)
echo.
echo    2. Scan a drive to find PostgreSQL automatically
echo       (useful if PostgreSQL is on D:\, E:\, P:\, etc.)
echo.
echo    3. Exit
echo.
set /p NOTFOUND_CHOICE="  Your choice (1-3): "

if "!NOTFOUND_CHOICE!"=="1" goto :psql_manual_path
if "!NOTFOUND_CHOICE!"=="2" goto :psql_scan_drive
if "!NOTFOUND_CHOICE!"=="3" exit /b 0
echo  Invalid choice.
pause
exit /b 1

:psql_manual_path
echo.
echo  Enter the full path to the PostgreSQL bin folder.
echo  This is the folder that contains psql.exe.
echo  Example:  P:\PostgreSQL\18\bin
echo            C:\Program Files\PostgreSQL\17\bin
echo.
set /p PSQL_BIN_DIR="  Path to bin folder: "
if "!PSQL_BIN_DIR!"=="" (
    echo  No path entered. Exiting.
    pause
    exit /b 1
)
if exist "!PSQL_BIN_DIR!\psql.exe" (
    set PSQL_EXE=!PSQL_BIN_DIR!\psql.exe
    for /f "tokens=*" %%v in ('"!PSQL_BIN_DIR!\psql.exe" --version 2^>^&1') do set PSQL_VER=%%v
    echo  OK  Found: !PSQL_EXE!
    echo      !PSQL_VER!
    goto :psql_found
) else (
    echo.
    echo  ERROR: psql.exe not found at: !PSQL_BIN_DIR!
    echo  Check the path and try again.
    echo.
    pause
    exit /b 1
)

:psql_scan_drive
echo.
echo  Enter the drive letter to scan (just the letter, e.g.  P  or  D  or  E).
echo.
set /p SCAN_DRIVE_LETTER="  Drive letter: "
if "!SCAN_DRIVE_LETTER!"=="" (
    echo  No drive entered. Exiting.
    pause
    exit /b 1
)
set SCAN_DRIVE=!SCAN_DRIVE_LETTER!:
echo.
echo  Scanning !SCAN_DRIVE!\ for psql.exe...
echo  (This may take a moment)
echo.

REM Search common subfolder patterns on the given drive
for /d %%a in ("!SCAN_DRIVE!\PostgreSQL\*" "!SCAN_DRIVE!\pgsql\*" "!SCAN_DRIVE!\Program Files\PostgreSQL\*" "!SCAN_DRIVE!\apps\PostgreSQL\*") do (
    if exist "%%a\bin\psql.exe" (
        set PSQL_EXE=%%a\bin\psql.exe
        for /f "tokens=*" %%v in ('"%%a\bin\psql.exe" --version 2^>^&1') do set PSQL_VER=%%v
        echo  OK  Found at: %%a\bin\psql.exe
        echo      !PSQL_VER!
        goto :psql_found
    )
)

REM Deeper scan: one more level down (e.g. P:\PostgreSQL\18\bin)
for /d %%a in ("!SCAN_DRIVE!\*") do (
    for /d %%b in ("%%a\*") do (
        if exist "%%b\bin\psql.exe" (
            set PSQL_EXE=%%b\bin\psql.exe
            for /f "tokens=*" %%v in ('"%%b\bin\psql.exe" --version 2^>^&1') do set PSQL_VER=%%v
            echo  OK  Found at: %%b\bin\psql.exe
            echo      !PSQL_VER!
            goto :psql_found
        )
    )
)

echo  Could not find psql.exe on !SCAN_DRIVE!\
echo.
echo  Try option 1 (enter path manually) or check that PostgreSQL is installed.
echo.
pause
exit /b 1

:psql_found

REM ── Get credentials ───────────────────────────────────────
echo.
echo [2/4] PostgreSQL credentials
echo.
echo  Username is almost always:  postgres
echo  Password is what you set when installing PostgreSQL.
echo.
set /p PG_USER="  Username [Enter for 'postgres']: "
if "!PG_USER!"=="" set PG_USER=postgres

echo.
echo  Enter your PostgreSQL password.
echo  (The cursor will not move while you type — that is normal)
echo.
set /p PG_PASS="  Password: "

REM ── Test connection ───────────────────────────────────────
echo.
echo [3/4] Testing connection...
echo.
set PGPASSWORD=!PG_PASS!
"!PSQL_EXE!" -U !PG_USER! -h localhost -c "\q" >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Could not connect to PostgreSQL.
    echo.
    echo  Check:
    echo    - Password correct?
    echo    - PostgreSQL running? (Open Services, look for postgresql-x64-*)
    echo    - Username correct?
    echo.
    set PGPASSWORD=
    pause
    exit /b 1
)
echo  OK  Connected as [!PG_USER!]

REM ── Pick database name ────────────────────────────────────
echo.
echo  Choose a name for the Grimoire database.
echo  (Any name works — it will be created for you)
echo.
set /p DB_NAME="  Database name [Enter for 'grimoire']: "
if "!DB_NAME!"=="" set DB_NAME=grimoire

REM ── Create database if needed ─────────────────────────────
"!PSQL_EXE!" -U !PG_USER! -h localhost -lqt 2>nul | findstr /C:" !DB_NAME! " >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo  Database [!DB_NAME!] already exists.
    set /p USE_EXISTING="  Use it? (Y/N): "
    if /i "!USE_EXISTING!"=="N" (
        set /p DB_NAME="  Enter a different name: "
        "!PSQL_EXE!" -U !PG_USER! -h localhost -c "CREATE DATABASE !DB_NAME!;" >nul 2>&1
        echo  OK  Database [!DB_NAME!] created.
    )
) else (
    echo.
    echo  Creating database [!DB_NAME!]...
    "!PSQL_EXE!" -U !PG_USER! -h localhost -c "CREATE DATABASE !DB_NAME!;" >nul 2>&1
    if %errorlevel% neq 0 (
        echo  ERROR: Could not create database.
        set PGPASSWORD=
        pause
        exit /b 1
    )
    echo  OK  Database [!DB_NAME!] created.
)

REM ── Write DATABASE_URL to .env ────────────────────────────
echo.
echo [4/4] Writing connection string to .env...

set DB_URL=postgresql://!PG_USER!:!PG_PASS!@localhost:5432/!DB_NAME!

if exist .env (
    powershell -NoProfile -Command "$f = Get-Content (Join-Path '%CD%' '.env'); $f = $f | ForEach-Object { if ($_ -match '^DATABASE_URL=') { 'DATABASE_URL=!DB_URL!' } elseif ($_ -match '^# DATABASE_URL=') { $_ } else { $_ } }; Set-Content (Join-Path '%CD%' '.env') -Value $f -Encoding ASCII"
) else (
    powershell -NoProfile -Command "Set-Content (Join-Path '%CD%' '.env') -Value @('DATABASE_URL=!DB_URL!','SESSION_SECRET=change-me-to-a-long-random-secret') -Encoding ASCII"
)

set PGPASSWORD=

if exist .env (
    echo  OK  .env updated.
    echo      DATABASE_URL=postgresql://!PG_USER!:***@localhost:5432/!DB_NAME!
) else (
    echo  ERROR: Could not write .env
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Database setup complete!
echo.
echo   User:      !PG_USER!
echo   Database:  !DB_NAME!
echo   Host:      localhost:5432
echo.
echo   Run start.bat to launch Grimoire.
echo   (start.bat syncs the schema tables automatically on startup)
echo ============================================================
echo.
pause
