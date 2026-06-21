#!/usr/bin/env bash
set -e

LOG=/tmp/cloudflared.log
rm -f "$LOG"

cleanup() {
  echo ""
  echo "Stopping..."
  [ -n "$CF_PID" ] && kill "$CF_PID" 2>/dev/null
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  pkill -P $$ 2>/dev/null
  exit 0
}
trap cleanup INT TERM EXIT

echo "[1/4] Starting cloudflared tunnel..."
cloudflared tunnel --no-autoupdate --url http://localhost:3001 > "$LOG" 2>&1 &
CF_PID=$!

echo "[2/4] Waiting for tunnel URL..."
URL=""
for i in $(seq 1 30); do
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" 2>/dev/null | head -1)
  if [ -n "$URL" ]; then break; fi
  sleep 1
done

if [ -z "$URL" ]; then
  echo "ERROR: tunnel URL not found"
  cat "$LOG"
  exit 1
fi

WS_URL="wss://${URL#https://}"
echo "       tunnel: $URL"
echo "       ws:     $WS_URL"

echo "VITE_WS_URL=$WS_URL" > .env
echo "       wrote:  .env"

echo "[3/4] Starting server..."
bun run server/index.ts &
SERVER_PID=$!
sleep 1

echo "[4/4] Starting dashboard..."
echo ""
echo "WS URL: $WS_URL"
echo "Run this on each VPS:"
echo "  WS_URL=$WS_URL NODE_NAME='Server X' NODE_LOCATION='City' bun run agent/index.ts"
echo ""

bun run dev:host
