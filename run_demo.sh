#!/bin/bash

# 1. Generate Test Data
echo "Generating test database..."
python tests/create_complex_db.py

# 2. Start Backend
echo "Starting Backend Server..."
uvicorn text2sql_agent.server:app --reload --port 8000 &
BACKEND_PID=$!

# 3. Start Frontend
echo "Starting Frontend..."
cd web
npm run dev &
FRONTEND_PID=$!

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "Demo running! Access the UI at http://localhost:5173"
wait
