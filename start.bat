@echo off
echo ========================================
echo Stock Portfolio Optimizer
echo ========================================
echo.

echo [1/2] Building frontend...
cd frontend
call npm install
call npm run build
cd ..
echo.

echo [2/2] Starting backend server...
echo Frontend will be served at: http://localhost:8080
echo.
call gradlew.bat bootRun
