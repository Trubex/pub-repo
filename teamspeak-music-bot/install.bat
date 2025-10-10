@echo off
REM TeamSpeak Music Bot Installation Script
REM For Windows

echo ======================================
echo TeamSpeak Music Bot - Quick Installer
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js v16 or higher from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] npm found
npm --version

REM Check if yt-dlp is installed
yt-dlp --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] yt-dlp is not installed!
    echo.
    echo Install yt-dlp with one of these commands:
    echo   - winget install yt-dlp
    echo   - pip install yt-dlp
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo [OK] yt-dlp found
    yt-dlp --version
)

REM Check if ffmpeg is installed
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] FFmpeg is not installed!
    echo.
    echo Install FFmpeg with:
    echo   - winget install FFmpeg
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo [OK] FFmpeg found
)

echo.
echo Installing Node.js dependencies...
call npm install

echo.
REM Check if config.json exists
if not exist "config.json" (
    echo Creating config.json from example...
    copy config.example.json config.json >nul
    echo [OK] config.json created
    echo.
    echo [IMPORTANT] Edit config.json with your TeamSpeak server details!
    echo    - host: Your TeamSpeak server IP
    echo    - username: ServerQuery username
    echo    - password: ServerQuery password
    echo    - channel: Channel name to join
    echo.
) else (
    echo [OK] config.json already exists
)

echo.
echo ======================================
echo Installation complete!
echo ======================================
echo.
echo Next steps:
echo 1. Edit config.json with your TeamSpeak server details
echo 2. Run: npm start
echo.
echo For help, see README.md
echo.
pause
