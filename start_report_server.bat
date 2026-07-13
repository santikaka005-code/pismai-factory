@echo off
setlocal
title Pismai Report Server
cd /d "%~dp0"

set "CODEX_PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

echo Starting Pismai Report Server...
echo Keep this window open while exporting PDF or Excel.
echo URL: http://127.0.0.1:8787
echo.

if exist "%CODEX_PYTHON%" (
  "%CODEX_PYTHON%" report_server.py
) else (
  python report_server.py
)

echo.
echo Report server stopped. Press any key to close.
pause
