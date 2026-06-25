@echo off
title Agape Lifecast - Starting...
cd /d "C:\laragon\www\agape-lifecast"

cls
echo.
echo  ==========================================
echo    Agape Lifecast - Starting...
echo  ==========================================
echo.

REM Start Laragon if not already running (needed for the database)
tasklist /FI "IMAGENAME eq laragon.exe" 2>NUL | find /I "laragon.exe" >NUL
if errorlevel 1 (
    echo  Starting database (Laragon)...
    start "" "C:\laragon\laragon.exe"
    timeout /t 5 /nobreak >nul
)

REM Start the web server (minimized, do not close)
start "Lifecast Web Server" /min cmd /k "cd /d "C:\laragon\www\agape-lifecast" && php artisan serve"

REM Start the background job worker (minimized, do not close)
start "Lifecast Worker" /min cmd /k "cd /d "C:\laragon\www\agape-lifecast" && php artisan queue:work --tries=3 --sleep=3"

REM Give the server a moment to boot
echo  Waiting for server to start...
timeout /t 4 /nobreak >nul

REM Open the app in the default browser
start "" "http://localhost:8000"

cls
echo.
echo  ==========================================
echo    Agape Lifecast is RUNNING
echo    http://localhost:8000
echo  ==========================================
echo.
echo  Two helper windows are running minimized
echo  in your taskbar -- do not close them.
echo.
echo  You can minimize THIS window.
echo  To stop the app, close all three windows.
echo.
pause >nul
