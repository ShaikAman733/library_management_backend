@echo off
echo Killing any existing Python and Node processes...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
echo Setting up backend and frontend dependencies...
if not exist backend\venv (
  python -m venv backend\venv
)
call backend\venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
if not exist frontend\node_modules (
  pushd frontend
  npm install
  popd
)
echo Setup complete. Backend virtual environment created at backend\venv and frontend dependencies installed.
