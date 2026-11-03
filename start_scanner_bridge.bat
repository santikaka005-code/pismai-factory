@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tools\hip-scanner-bridge.cjs
    pause
    exit /b
  )
  echo Node.js is required. Install Node.js before starting the HIP bridge.
  pause
  exit /b 1
)
node tools\hip-scanner-bridge.cjs
pause
