@echo off
cd /d "%~dp0"
echo Starting Claude Web...
start "" http://localhost:3000
node server.js
pause