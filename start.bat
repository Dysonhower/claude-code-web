@echo off
cd /d "D:\coding\claude-web"
echo Starting Claude Web...
start http://localhost:3000
node server.js
pause