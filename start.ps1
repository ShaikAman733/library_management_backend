Write-Host "Starting backend and frontend..."

Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd .\backend; .\venv\Scripts\Activate.ps1; python manage.py runserver 8000'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd .\frontend; npm start'

Write-Host "Started backend on http://localhost:8000 and frontend on default React port."