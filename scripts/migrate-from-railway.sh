#!/bin/sh
# One-off migration: copy SOURCE_DATABASE_URL → TARGET_DATABASE_URL.
# Wired as a Fly release_command so it runs in a private-network machine
# (bypasses the broken local wireguard proxy).
#
# No-op unless BOTH SOURCE_DATABASE_URL and TARGET_DATABASE_URL are set,
# so leaving this in fly.toml without the secrets is safe.

set -eu

if [ -z "${SOURCE_DATABASE_URL:-}" ] || [ -z "${TARGET_DATABASE_URL:-}" ]; then
  echo "[migrate] SOURCE_DATABASE_URL or TARGET_DATABASE_URL not set — skipping."
  exit 0
fi

echo "[migrate] dumping source → restoring into target"
pg_dump --no-owner --no-privileges --clean --if-exists -Fc "$SOURCE_DATABASE_URL" \
  | pg_restore --no-owner --no-privileges --exit-on-error -d "$TARGET_DATABASE_URL"

echo "[migrate] done"
