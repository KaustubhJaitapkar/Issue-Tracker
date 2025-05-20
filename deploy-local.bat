@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo       Issue Tracker Deployment Script
echo ===================================================
echo.

echo Setting up backend...
cd backend
call npm install
start cmd /k "echo Starting backend server... && npm run dev"
cd ..

REM Frontend setup
if not exist frontend (
    echo Frontend directory not found!
    pause
    exit /b 1
)

echo Setting up frontend...
cd frontend
call npm install
start cmd /k "echo Starting frontend server... && npm run dev"
cd ..

echo.
echo ===================================================
echo       Deployment Complete!
echo ===================================================
echo.
echo Frontend should be running at: http://localhost:9563
echo Backend API should be running at: http://localhost:8000
echo MySQL database is running at: localhost:3306
echo.
echo Database Credentials:
echo   Username: root
echo   Password: 490404
echo   Database: issueTracker
echo.
echo To stop the application, close the command prompt windows.
echo.
echo Note: If the frontend is not running on port 9563, check the
echo frontend console window for the actual URL.
echo.
pause
