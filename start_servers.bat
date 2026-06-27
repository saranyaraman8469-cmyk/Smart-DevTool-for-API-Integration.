@echo off
echo Starting Smart DevTool Backend...
start cmd /k "cd backend && python -m uvicorn app.main:app --reload"

echo Starting Smart DevTool Frontend...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting up!
echo The frontend will be available at http://localhost:3000
echo The backend API will be available at http://localhost:8000
