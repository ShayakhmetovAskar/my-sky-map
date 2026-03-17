#!/bin/bash
set -e

ROLE=${ROLE:-api}

echo "Running database migrations..."
alembic upgrade head

case "$ROLE" in
  api)
    echo "Starting solver API..."
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 "$@"
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
