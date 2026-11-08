@echo off
setlocal enabledelayedexpansion
title Video Multitool Starter
color 0b

echo ====================================================
echo             VIDEO MULTITOOL STARTER
echo ====================================================
echo.

:: 1. Pruefe Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FEHLER] Python wurde nicht gefunden! Bitte installiere Python 3.10 oder neuer.
    pause
    exit /b 1
)

:: 2. Lokale IPv4 Adresse ermitteln
set "LOCAL_IP=127.0.0.1"
for /f "tokens=4" %%a in ('route print 0.0.0.0 2^>nul ^| findstr /c:" 0.0.0.0 "' ) do (
    if not "%%a"=="" (
        set "LOCAL_IP=%%a"
    )
)

echo [INFO] Erkannte lokale IP-Adresse: %LOCAL_IP%
echo.

:: 3. Pruefe Backend-Pakete
echo [INFO] Pruefe Python-Pakete...
python -c "import fastapi, yt_dlp, uvicorn" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Installiere fehlende Backend-Pakete...
    pip install -r backend\requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo [FEHLER] Installation der Python-Pakete fehlgeschlagen.
        pause
        exit /b 1
    )
)

:: 4. Pruefe ob Backend bereits auf Port 8000 laeuft
netstat -ano | findstr :8000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Backend-Server laeuft bereits auf Port 8000.
) else (
    echo [INFO] Starte Backend-API auf Port 8000...
    start "Video Multitool - Backend API" /min cmd /c "python backend\server.py"
)

:: Warte 2 Sekunden auf Start
timeout /t 2 /nobreak >nul

:: 5. Pruefe ob Frontend-Server auf Port 3000 laeuft
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Web-App Server laeuft bereits auf Port 3000.
) else (
    echo [INFO] Starte lokalen Webserver auf Port 3000...
    start "Video Multitool - Web Frontend" /min cmd /c "python -m http.server 3000"
)

:: Warte 1 Sekunde
timeout /t 1 /nobreak >nul

echo.
echo ====================================================
echo        ALLE DIENSTE ERFOLGREICH GESTARTET!
echo ====================================================
echo.
echo  [PC / Lokaler Browser]:
echo    URL: http://localhost:3000
echo.
echo  [iPad / Safari / Homescreen im selben WLAN]:
echo    URL: http://%LOCAL_IP%:3000
echo    (Backend-API: http://%LOCAL_IP%:8000)
echo.
echo ====================================================
echo.
echo Oeffne App im Standard-Browser...
start http://localhost:3000

echo.
echo Dieses Fenster kann minimiert werden, waehrend du die App nutzt.
pause
