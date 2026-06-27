Write-Host "Setting up frontend and backend dependencies..."

if (-not (Test-Path .\backend\venv)) {
    python -m venv .\backend\venv
}
.\backend\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r .\backend\requirements.txt

if (-not (Test-Path .\frontend\node_modules)) {
    cd .\frontend
    npm install
}

Write-Host "Setup complete. Backend virtualenv created at backend\venv and frontend dependencies installed."