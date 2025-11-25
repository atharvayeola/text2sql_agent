#!/bin/bash

# Start server in background
uvicorn text2sql_agent.server:app --port 8001 &
PID=$!
sleep 5

# Upload file
echo "Uploading file..."
curl -X POST -F "file=@tests/dummy.csv" http://localhost:8001/upload

# Execute SQL
echo -e "\nExecuting SQL..."
curl -X POST -H "Content-Type: application/json" -d '{"sql": "SELECT * FROM dummy"}' http://localhost:8001/api/execute_sql

# Generate SQL (expecting error or mock response if key missing, but testing endpoint reachability)
echo -e "\nGenerating SQL..."
curl -X POST -H "Content-Type: application/json" -d '{"question": "Show all users", "model_type": "openai"}' http://localhost:8001/api/generate_sql

# Kill server
kill $PID
