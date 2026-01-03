#!/bin/bash
# Kill all processes using port 5000
PORT=5000
PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
  echo "✓ Port $PORT is already free"
  exit 0
fi

echo "Killing process $PID on port $PORT..."
kill -9 $PID 2>/dev/null

sleep 1

if lsof -ti:$PORT > /dev/null 2>&1; then
  echo "⚠ Process still running. Please stop it manually with Ctrl+C"
  exit 1
else
  echo "✓ Port $PORT is now free"
  exit 0
fi

