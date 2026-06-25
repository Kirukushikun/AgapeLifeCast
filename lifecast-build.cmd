@echo off
title Agape Lifecast - Build
cd /d "C:\laragon\www\agape-lifecast"

cls
echo.
echo  ==========================================
echo    Agape Lifecast - Building Assets
echo  ==========================================
echo.
echo  Run this after any code changes.
echo  Operators do NOT need to run this.
echo.

call npm run build

echo.
echo  ==========================================
echo    Build complete!
echo    Operators can now run lifecast-start.cmd
echo  ==========================================
echo.
pause
