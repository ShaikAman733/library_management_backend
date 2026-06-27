@echo off
echo Killing any existing Python and Node processes...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
echo Starting backend and frontend...
start cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && python manage.py runserver 8000"
start cmd /k "cd /d %~dp0frontend && npm start"
echo Started backend on http://localhost:8000 and frontend on the default React port.
