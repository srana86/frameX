#!/bin/bash
# Helper script to run the simulation with proper environment setup

cd "$(dirname "$0")/.."

# Load .env file if it exists
if [ -f .env ]; then
  echo "📝 Loading .env file..."
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

# Check if MONGODB_URI is set
if [ -z "$MONGODB_URI" ]; then
  echo "❌ MONGODB_URI is not set!"
  echo ""
  echo "Please set MONGODB_URI in your .env file:"
  echo "   MONGODB_URI=mongodb://user:password@host:port/database_name"
  echo ""
  exit 1
fi

# Run the simulation
echo "🚀 Starting simulation..."
echo ""
npx tsx scripts/simulate-full-flow-standalone.ts

