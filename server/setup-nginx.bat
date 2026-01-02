@echo off
echo ==========================================
echo   Nginx Setup for Kissan E-Bazzar
echo ==========================================
echo.

:: Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Please run this script as Administrator!
    pause
    exit /b 1
)

:: Set variables
set NGINX_VERSION=1.24.0
set NGINX_ZIP=nginx-%NGINX_VERSION%.zip
set NGINX_URL=http://nginx.org/download/%NGINX_ZIP%
set NGINX_DIR=C:\nginx

:: Check if Nginx is already installed
if exist "%NGINX_DIR%\nginx.exe" (
    echo Nginx is already installed at %NGINX_DIR%
    goto :configure
)

:: Create directory
echo Creating Nginx directory...
mkdir "%NGINX_DIR%" 2>nul

:: Download Nginx
echo Downloading Nginx %NGINX_VERSION%...
powershell -Command "Invoke-WebRequest -Uri '%NGINX_URL%' -OutFile '%TEMP%\%NGINX_ZIP%'"

:: Extract Nginx
echo Extracting Nginx...
powershell -Command "Expand-Archive -Path '%TEMP%\%NGINX_ZIP%' -DestinationPath '%TEMP%\nginx-extract' -Force"

:: Move files to final location
xcopy /E /Y "%TEMP%\nginx-extract\nginx-%NGINX_VERSION%\*" "%NGINX_DIR%\"

:: Cleanup
del "%TEMP%\%NGINX_ZIP%" 2>nul
rmdir /S /Q "%TEMP%\nginx-extract" 2>nul

:configure
echo.
echo Configuring Nginx...

:: Copy custom config
copy /Y "%~dp0nginx.conf" "%NGINX_DIR%\conf\nginx.conf"

echo.
echo ==========================================
echo   Nginx Setup Complete!
echo ==========================================
echo.
echo Nginx installed at: %NGINX_DIR%
echo.
echo To start Nginx:
echo   cd %NGINX_DIR%
echo   nginx.exe
echo.
echo To stop Nginx:
echo   nginx.exe -s stop
echo.
echo To reload config:
echo   nginx.exe -s reload
echo.
pause
