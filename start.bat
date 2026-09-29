@echo off
title PUBG-STATS Server

cd /d "%~dp0"

echo ==============================
echo       PUBG-STATS SERVER
echo ==============================
echo.
echo Iniciando servidor...
echo.

node server.js

echo.
echo Servidor encerrado.
pause