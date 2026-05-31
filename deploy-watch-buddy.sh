#!/bin/sh
set -eu

APP_NAME="${APP_NAME:-watch-buddy}"
IMAGE_TAG="${IMAGE_TAG:-watch-buddy:latest}"
TAR_FILE="${TAR_FILE:-watch-buddy-amd64.tar}"
APP_PORT="${APP_PORT:-8037}"
CONTAINER_PORT="${CONTAINER_PORT:-3000}"
ENV_FILE="${ENV_FILE:-.env}"
NATAPP_SCRIPT="${NATAPP_SCRIPT:-/opt/natapp/run_natapp.sh}"
NATAPP_LOG="${NATAPP_LOG:-/opt/natapp/natapp.log}"
NATAPP_PID="${NATAPP_PID:-/opt/natapp/natapp.pid}"

cd "$(dirname "$0")"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1"
    exit 1
  fi
}

wait_for_http() {
  url="$1"
  i=0
  while [ "$i" -lt 30 ]; do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      return 0
    fi
    i=$((i + 1))
    sleep 1
  done
  return 1
}

start_natapp() {
  if [ ! -f "$NATAPP_SCRIPT" ]; then
    echo "NATAPP script not found: $NATAPP_SCRIPT"
    echo "Skip NATAPP startup."
    return 0
  fi

  chmod +x "$NATAPP_SCRIPT"
  mkdir -p "$(dirname "$NATAPP_LOG")"

  if [ -f "$NATAPP_PID" ]; then
    old_pid="$(cat "$NATAPP_PID" 2>/dev/null || true)"
    if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
      echo "NATAPP is already running. pid=$old_pid"
    else
      nohup "$NATAPP_SCRIPT" > "$NATAPP_LOG" 2>&1 &
      echo $! > "$NATAPP_PID"
      echo "NATAPP started. pid=$(cat "$NATAPP_PID")"
    fi
  else
    nohup "$NATAPP_SCRIPT" > "$NATAPP_LOG" 2>&1 &
    echo $! > "$NATAPP_PID"
    echo "NATAPP started. pid=$(cat "$NATAPP_PID")"
  fi

  echo "Waiting for NATAPP tunnel address..."
  i=0
  while [ "$i" -lt 20 ]; do
    https_url="$(grep -Eo 'https://[^ ]+' "$NATAPP_LOG" 2>/dev/null | head -n 1 || true)"
    http_url="$(grep -Eo 'http://[^ ]+\.natapp[^ ]*' "$NATAPP_LOG" 2>/dev/null | head -n 1 || true)"

    if [ -n "$https_url" ]; then
      echo "HTTPS URL: $https_url"
      return 0
    fi

    if [ -n "$http_url" ]; then
      host="$(echo "$http_url" | sed 's#^http://##' | cut -d/ -f1)"
      echo "NATAPP HTTP URL: $http_url"
      echo "Try HTTPS URL: https://$host"
      echo "If HTTPS cannot open, enable HTTPS in NATAPP tunnel/domain settings."
      return 0
    fi

    i=$((i + 1))
    sleep 1
  done

  echo "NATAPP started, but no tunnel URL detected yet."
  echo "Check logs: tail -f $NATAPP_LOG"
}

need_cmd docker
need_cmd curl

if [ ! -f "$TAR_FILE" ]; then
  echo "Missing image tar: $TAR_FILE"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

echo "Loading Docker image from $TAR_FILE..."
docker load -i "$TAR_FILE"

if docker ps -a --format '{{.Names}}' | grep -Fx "$APP_NAME" >/dev/null 2>&1; then
  echo "Replacing existing container: $APP_NAME"
  docker stop "$APP_NAME" >/dev/null 2>&1 || true
  docker rm "$APP_NAME" >/dev/null 2>&1 || true
fi

echo "Starting container: $APP_NAME"
docker run -d \
  -p "$APP_PORT:$CONTAINER_PORT" \
  --name "$APP_NAME" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -e HOST=0.0.0.0 \
  -e PORT="$CONTAINER_PORT" \
  "$IMAGE_TAG" >/dev/null

echo "Waiting for app health..."
if wait_for_http "http://127.0.0.1:$APP_PORT/"; then
  echo "App is ready: http://127.0.0.1:$APP_PORT"
else
  echo "App did not become ready in time."
  echo "Container logs:"
  docker logs --tail=80 "$APP_NAME" || true
  exit 1
fi

start_natapp

echo
echo "Deployment complete."
echo "Container: $APP_NAME"
echo "Local URL: http://127.0.0.1:$APP_PORT"
echo "Logs:"
echo "  docker logs -f $APP_NAME"
echo "  tail -f $NATAPP_LOG"
