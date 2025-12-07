#!/usr/bin/env bash
set -euo pipefail

# Smoke test for hello-world deployment via docker compose
# Usage:
#   ./run-compose.sh           # builds and starts
#   ./run-compose.sh down      # stops and removes
#   PORT=3000 ./run-compose.sh # override port if needed

MODE="up"
if [[ "${1:-}" == "down" ]]; then
  MODE="down"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-3000}"

cd "$PROJECT_ROOT"

if [[ "$MODE" == "down" ]]; then
  echo "🧹 Bringing stack down..."
  docker compose -f deployment/docker-compose.yml down
  exit 0
fi

echo "ℹ️  Ensuring env file exists..."
if [[ ! -f deployment/.env ]]; then
  cp deployment/.env.template deployment/.env
fi

export PORT

echo "🚀 Building and starting stack..."
docker compose -f deployment/docker-compose.yml up --build -d

echo "⏳ Waiting for service..."
sleep 2

echo "🔍 Health check: http://localhost:${PORT}"
if curl -sf "http://localhost:${PORT}" >/dev/null; then
  echo "✅ Service is reachable"
else
  echo "⚠️  Service not reachable; check logs with 'docker compose -f deployment/docker-compose.yml logs'"
  exit 1
fi

echo "🎉 Done. To stop: ./run-compose.sh down"
