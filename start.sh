#!/bin/bash

# Prompt Analyzer - Start Script

echo "🚀 Starting Prompt Analyzer Dashboard..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down servers..."
    jobs -p | xargs -r kill
    exit
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Start FastAPI backend
echo "📡 Starting FastAPI backend on port 8001..."
cd backend && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start Next.js frontend
echo "🌐 Starting Next.js frontend on port 3000..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Both servers are running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8001"
echo "📚 API Docs: http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait
