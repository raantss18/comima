#!/usr/bin/env bash
# Teste la migration et les règles RLS dans un PostgreSQL jetable (Docker).
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
NAME=comima-rls-test
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -e POSTGRES_PASSWORD=test \
  -v "$DIR/migrations:/migrations:ro" -v "$DIR/tests:/tests:ro" postgres:16-alpine >/dev/null
trap 'docker rm -f "$NAME" >/dev/null' EXIT
until docker exec "$NAME" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
sleep 1
docker exec "$NAME" psql -q -U postgres -f /tests/rls_test.sql
