@echo off
setlocal
title Check Pismai Report Server

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8787/reports/daily-excel?date=2026-07-12' -TimeoutSec 3; Write-Host 'Report Server is running.' -ForegroundColor Green; Write-Host ('Status: ' + $r.StatusCode) } catch { Write-Host 'Report Server is NOT running.' -ForegroundColor Red; Write-Host 'Please open start_report_server.bat and keep that window open.' }"

echo.
pause
