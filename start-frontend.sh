#!/bin/bash
# start-frontend.sh - Script to ensure the frontend starts on port 5173 to match backend CORS expectations

echo "🔍 Checking if port 5173 is already in use..."

# Check if port 5173 is in use
if lsof -i :5173 > /dev/null 2>&1; then
  echo "⚠️ Port 5173 is already in use. Attempting to free it..."
  
  # Find the PID using port 5173 and kill it
  PID=$(lsof -i :5173 | grep LISTEN | awk '{print $2}')
  if [ ! -z "$PID" ]; then
    echo "🛑 Killing process with PID $PID on port 5173"
    kill -9 $PID
    echo "✅ Port 5173 has been freed"
  else
    echo "❌ Failed to identify the process using port 5173"
  fi
else
  echo "✅ Port 5173 is available"
fi

# Start the development server on port 5173
echo "🚀 Starting development server on port 5173..."
npm run dev -- --port 5173 --force

# If the server fails to start on port 5173, try any available port
if [ $? -ne 0 ]; then
  echo "⚠️ Failed to start on port 5173. Attempting any available port..."
  npm run dev
fi
