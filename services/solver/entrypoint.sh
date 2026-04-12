#!/bin/bash
set -e

ROLE=${ROLE:-api}

echo "Running database migrations..."
alembic upgrade head

case "$ROLE" in
  api)
    echo "Starting solver API..."
    # --proxy-headers: make request.client.host reflect the real client IP
    #   behind a reverse proxy (ALB, nginx, istio). Required for the
    #   per-IP rate limit in /auth/guest to work correctly in production.
    # --forwarded-allow-ips="*": trust X-Forwarded-* only if the deployment
    #   puts a trusted proxy in front of the container (we do). Narrow this
    #   to the proxy's subnet if the solver is ever exposed directly.
    exec uvicorn app.main:app \
      --host 0.0.0.0 --port 8000 \
      --proxy-headers --forwarded-allow-ips="*" \
      "$@"
    ;;
  worker)
    echo "Starting solver worker..."
    exec python -m worker.main "$@"
    ;;
  *)
    echo "Unknown ROLE: $ROLE (expected: api or worker)"
    exit 1
    ;;
esac
