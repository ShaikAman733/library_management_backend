Write-Host "Creating and activating backend virtual environment..."
if (-not (Test-Path .\venv)) {
  python -m venv .\venv
}
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
Write-Host "Backend dependencies installed. Run migrations with: python manage.py migrate"