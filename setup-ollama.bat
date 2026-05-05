@echo off
setlocal EnableDelayedExpansion
title Prompt Vault — Ollama Setup

echo.
echo ============================================================
echo   PROMPT VAULT — Ollama Setup
echo   Local AI for Windows 11
echo ============================================================
echo.

REM ── Check if Ollama is installed ──────────────────────────
echo [1/3] Checking for Ollama...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Ollama is not installed.
    echo.
    echo  Please download and install Ollama for Windows:
    echo    https://ollama.com/download/windows
    echo.
    echo  After installing, re-run this file.
    echo.
    set /p OPEN="Open the download page now? (Y/N): "
    if /i "!OPEN!"=="Y" start https://ollama.com/download/windows
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('ollama --version 2^>^&1') do set OLLAMA_VER=%%v
echo  OK  %OLLAMA_VER%

REM ── Check if Ollama server is running ─────────────────────
echo.
echo [2/3] Checking Ollama server...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo  Ollama server is not running. Starting it...
    start "" ollama serve
    echo  Waiting for Ollama to start...
    timeout /t 4 /nobreak >nul
    curl -s http://localhost:11434/api/tags >nul 2>&1
    if %errorlevel% neq 0 (
        echo  ERROR: Could not start Ollama. Try running "ollama serve" manually.
        pause
        exit /b 1
    )
)
echo  OK  Ollama server is running at http://localhost:11434

REM ── Pull a model ──────────────────────────────────────────
echo.
echo [3/3] Setting up a model...
echo.
echo  Available recommended models:
echo    1. llama3.2        (2GB)  — Fast, good for most tasks
echo    2. llama3.1        (4GB)  — More capable, slower
echo    3. mistral         (4GB)  — Great for code and prompts
echo    4. phi3            (2GB)  — Lightweight, very fast
echo    5. Skip            — I already have models
echo.
set /p MODEL_CHOICE="Choose a model to download (1-5): "

if "!MODEL_CHOICE!"=="1" set MODEL_NAME=llama3.2
if "!MODEL_CHOICE!"=="2" set MODEL_NAME=llama3.1
if "!MODEL_CHOICE!"=="3" set MODEL_NAME=mistral
if "!MODEL_CHOICE!"=="4" set MODEL_NAME=phi3
if "!MODEL_CHOICE!"=="5" goto :skip_pull
if not defined MODEL_NAME (
    echo  Invalid choice. Defaulting to llama3.2
    set MODEL_NAME=llama3.2
)

echo.
echo  Downloading %MODEL_NAME%... (this may take several minutes)
echo.
ollama pull %MODEL_NAME%
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Failed to pull %MODEL_NAME%. Check your internet connection.
    pause
    exit /b 1
)
echo.
echo  OK  %MODEL_NAME% downloaded successfully.

:skip_pull
echo.
echo ============================================================
echo   Ollama is ready!
echo.
echo   Next steps:
echo     1. Open Prompt Vault in your browser
echo     2. Go to AI Providers settings
echo     3. Set Ollama URL: http://localhost:11434
echo     4. Select your model for the assistant
echo.
echo   TIP: Ollama needs to be running whenever you use Prompt Vault.
echo        You can add it to startup or just run this file again.
echo ============================================================
echo.
pause
