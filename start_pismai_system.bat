@echo off
setlocal
cd /d "%~dp0"

echo Starting Pismai Report Server and opening the app...
echo Keep the server window open while exporting PDF or Excel.
echo.

start "Pismai Report Server" cmd /k ""%~dp0start_report_server.bat""

timeout /t 2 /nobreak >nul
start "" "%~dp0index.html"
