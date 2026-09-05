@echo off
title TaxSetu Localhost Web Server
echo ========================================================
echo Starting TaxSetu Web Application on http://localhost:3000
echo ========================================================
cd /d "%~dp0"
node node_modules/vite/bin/vite.js --port=3000 --host=0.0.0.0
pause
