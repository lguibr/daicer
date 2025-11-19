#!/bin/bash

# Script to start E2E environment services in proper order
# Run this first, then run tests with: cd e2e && SKIP_WEBSERVER=1 yarn test:headed

echo "🚀 Starting E2E Environment..."
echo ""

# Kill any existing processes
echo "🛑 Cleaning up old processes..."
lsof -ti:3100,3101,8081,9100,4001 | xargs kill -9 2>/dev/null || true
sleep 2

# Start Firebase emulators
echo "📍 Starting Firebase emulators (ports 8081/9100/4001)..."
firebase emulators:start --config firebase.e2e.json --import=./emulator-data-e2e --export-on-exit=./emulator-data-e2e &
EMULATOR_PID=$!

# Wait for emulators to be ready
echo "⏳ Waiting for emulators to initialize..."
for i in {1..30}; do
  if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "✓ Firebase emulators ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Emulators failed to start"
    kill $EMULATOR_PID 2>/dev/null
    exit 1
  fi
  sleep 2
done

# Start backend
echo "🔧 Starting backend (port 3101)..."
cd backend
PORT=3101 FIRESTORE_EMULATOR_HOST=localhost:8081 FIREBASE_AUTH_EMULATOR_HOST=localhost:9100 yarn dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to initialize..."
for i in {1..45}; do
  if curl -s http://localhost:3101 > /dev/null 2>&1; then
    echo "✓ Backend ready!"
    break
  fi
  if [ $i -eq 45 ]; then
    echo "❌ Backend failed to start"
    kill $EMULATOR_PID $BACKEND_PID 2>/dev/null
    exit 1
  fi
  sleep 2
done

# Start frontend
echo "💻 Starting frontend (port 3100)..."
cd frontend
VITE_PORT=3100 VITE_API_URL=http://localhost:3101 yarn dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to initialize..."
for i in {1..30}; do
  if curl -s http://localhost:3100 > /dev/null 2>&1; then
    echo "✓ Frontend ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Frontend failed to start"
    kill $EMULATOR_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
  fi
  sleep 2
done

echo ""
echo "✅ E2E Environment is ready!"
echo ""
echo "  📍 Emulator UI: http://localhost:4001"
echo "  🔧 Backend:     http://localhost:3101"
echo "  💻 Frontend:    http://localhost:3100"
echo ""
echo "Now run tests with:"
echo "  cd e2e && SKIP_WEBSERVER=1 yarn test:headed"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running and forward Ctrl+C to all processes
trap "kill $EMULATOR_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

