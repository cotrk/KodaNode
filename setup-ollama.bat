@echo off
setlocal EnableDelayedExpansion
title Grimoire — Ollama Setup

echo.
echo ============================================================
echo   GRIMOIRE — Local AI Setup (Ollama)
echo ============================================================
echo.

REM ── Check if Ollama is installed ──────────────────────────
echo [1/3] Checking for Ollama...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Ollama is not installed.
    echo.
    echo  Download it from: https://ollama.com/download/windows
    echo.
    set /p OPEN="  Open the download page now? (Y/N): "
    if /i "!OPEN!"=="Y" start https://ollama.com/download/windows
    echo.
    echo  After installing Ollama, run this file again.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('ollama --version 2^>^&1') do set OLLAMA_VER=%%v
echo  OK  %OLLAMA_VER%

REM ── Start Ollama server if not running ───────────────────
echo.
echo [2/3] Checking Ollama server...
curl -s --max-time 2 http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo  Ollama is not running — starting it now...
    start "" ollama serve
    echo  Waiting for Ollama to start...
    timeout /t 5 /nobreak >nul
    curl -s --max-time 2 http://localhost:11434/api/tags >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo  ERROR: Could not connect to Ollama.
        echo  Try running "ollama serve" manually in a separate window.
        echo.
        pause
        exit /b 1
    )
)
echo  OK  Ollama server is running at http://localhost:11434

REM ── Pick and pull a model ─────────────────────────────────
echo.
echo [3/3] Choose a model to download:
echo.
echo    1. llama3.2     (2 GB)  — Recommended. Fast and capable.
echo    2. phi3         (2 GB)  — Very lightweight, great for low-RAM systems.
echo    3. mistral      (4 GB)  — Strong reasoning and code.
echo    4. llama3.1     (4 GB)  — More capable, needs more RAM.
echo    5. Skip         — I already have a model installed.
echo.
set /p MODEL_CHOICE="  Your choice (1-5): "

if "!MODEL_CHOICE!"=="1" set MODEL_NAME=llama3.2
if "!MODEL_CHOICE!"=="2" set MODEL_NAME=phi3
if "!MODEL_CHOICE!"=="3" set MODEL_NAME=mistral
if "!MODEL_CHOICE!"=="4" set MODEL_NAME=llama3.1
if "!MODEL_CHOICE!"=="5" goto :done
if not defined MODEL_NAME (
    echo  Invalid choice. Defaulting to llama3.2
    set MODEL_NAME=llama3.2
)

echo.
echo  Downloading %MODEL_NAME%...
echo  This may take several minutes depending on your connection.
echo.
ollama pull %MODEL_NAME%
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Download failed. Check your internet connection and try again.
    echo.
    pause
    exit /b 1
)
echo.
echo  OK  %MODEL_NAME% is ready.

:done
echo.
echo ============================================================
echo   Ollama is set up!
echo.
echo   In Grimoire:
echo     Go to AI Providers in the sidebar
echo     Set Ollama URL:  http://localhost:11434
echo     Select your model for the AI Assistant
echo.
echo   TIP: Ollama must be running each time you use Grimoire.
echo        Run this file again to start it if needed.
echo ============================================================
echo.
pause
