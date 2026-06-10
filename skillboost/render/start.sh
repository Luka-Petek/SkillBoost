#!/usr/bin/env bash
set -euo pipefail

: "${SERVER_PORT:=8080}"
: "${PORT:=10000}"

java -jar /app/app.jar &
APP_PID=$!

nginx -g "daemon off;" &
NGINX_PID=$!

shutdown() {
  kill "$APP_PID" "$NGINX_PID" 2>/dev/null || true
}

trap shutdown SIGTERM SIGINT

wait -n "$APP_PID" "$NGINX_PID"
EXIT_CODE=$?
shutdown
exit "$EXIT_CODE"
