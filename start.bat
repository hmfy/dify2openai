@echo off
echo Starting Dify Manager...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "npm run start:dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Development Server...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3012
echo.
pause