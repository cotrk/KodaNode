@echo off
setlocal EnableDelayedExpansion
title Grimoire — Starting...

echo.
echo ============================================================
echo   GRIMOIRE — Starting
echo ============================================================
echo.

REM ── Check Node.js ──────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found.
    echo  Run install.bat first.
    echo.
    pause
    exit /b 1
)

REM ── Check node_modules ────────────────────────────────────
if not exist node_modules (
    echo  Dependencies not installed. Running install...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo  ERROR: Install failed. Check your internet connection.
        echo.
        pause
        exit /b 1
    )
    echo.
)

REM ── Check .env ────────────────────────────────────────────
if not exist .env (
    echo  ERROR: .env file not found.
    echo  Run install.bat first to create it, then add your DATABASE_URL.
    echo.
    pause
    exit /b 1
)

REM ── Load .env into Windows environment ───────────────────
echo  Loading configuration...

REM Use PowerShell to parse .env — handles UTF-8 BOM correctly
powershell -NoProfile -Command "Get-Content (Join-Path '%CD%' '.env') | Where-Object { $_ -match '^\s*[^#].+=' } | ForEach-Object { 'SET ' + $_ } | Set-Content '%TEMP%\grimoire_env.bat' -Encoding ASCII"

if exist "%TEMP%\grimoire_env.bat" (
    call "%TEMP%\grimoire_env.bat"
    del "%TEMP%\grimoire_env.bat" >nul 2>&1
) else (
    echo  WARN: Could not parse .env — trying fallback method...
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if not "%%a"=="" set "%%a=%%b"
    )
)
set NODE_ENV=development

REM ── Verify DATABASE_URL is set ───────────────────────────
if "!DATABASE_URL!"=="" (
    echo.
    echo  ERROR: DATABASE_URL is not set in your .env file.
    echo.
    echo  The correct format for local PostgreSQL is:
    echo    DATABASE_URL=postgresql://postgres:YourPassword@localhost:5432/grimoire
    echo                              ^^^^^^^^  ^^^^^^^^^^^  ^^^^^^^^^  ^^^^  ^^^^^^^^
    echo                              username  password     host       port  database
    echo.
    start notepad.exe "%CD%\.env"
    pause
    exit /b 1
)

REM ── Validate DATABASE_URL has credentials (contains @) ───
echo !DATABASE_URL! | findstr /C:"@" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: DATABASE_URL is missing username and password.
    echo.
    echo  Your current value looks like:
    echo    !DATABASE_URL!
    echo.
    echo  It must follow this format — note the  user:password@  part:
    echo    postgresql://postgres:YourPassword@localhost:5432/YourDatabase
    echo.
    echo  Steps to fix:
    echo    1. Open your .env file ^(Notepad will open now^)
    echo    2. Replace DATABASE_URL with the correct format above
    echo    3. Use your actual PostgreSQL username and password
    echo    4. Save the file and run start.bat again
    echo.
    echo  Your PostgreSQL username is usually:  postgres
    echo  Your password is what you set when installing PostgreSQL.
    echo.
    echo  To create a fresh database, open pgAdmin or run:
    echo    psql -U postgres -c "CREATE DATABASE grimoire;"
    echo.
    start notepad.exe "%CD%\.env"
    pause
    exit /b 1
)

REM ── Show which database we are connecting to ─────────────
for /f "tokens=* delims=" %%i in ('powershell -NoProfile -Command "if ('!DATABASE_URL!' -match '@[^/]+/([^?]+)') { $Matches[1] } else { 'unknown' }"') do set DB_NAME=%%i
for /f "tokens=* delims=" %%i in ('powershell -NoProfile -Command "if ('!DATABASE_URL!' -match '://([^:]+):') { $Matches[1] } else { 'unknown' }"') do set DB_USER=%%i
echo  OK  Configuration loaded.
echo  DB  Connecting as [%DB_USER%] to database [%DB_NAME%]

REM ── Sync database schema ─────────────────────────────────
echo.
echo  Syncing database schema...
call npx drizzle-kit push --force
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Schema sync failed.
    echo  Check your DATABASE_URL in .env. Common problems:
    echo    - Wrong password
    echo    - Database does not exist  ^(create it in pgAdmin first^)
    echo    - PostgreSQL service not running
    echo.
    pause
    exit /b 1
) else (
    echo  OK  Database [%DB_NAME%] is ready.
)

REM ── Check Ollama (optional) ───────────────────────────────
echo.
echo  Checking Ollama...
curl -s --max-time 2 http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo  NOTE: Ollama not running. AI features unavailable until you run setup-ollama.bat
) else (
    echo  OK  Ollama running.
)

REM ── Start server and open browser ─────────────────────────
echo.
echo ============================================================
echo   Starting Grimoire on http://localhost:5000
echo   Browser will open automatically in 3 seconds.
echo   Keep this window open — press Ctrl+C to stop.
echo ============================================================
echo.

powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 3; Start-Process 'http://localhost:5000'"
npx tsx server/index.ts
