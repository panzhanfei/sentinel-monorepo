#!/usr/bin/env bash
# Pack Next standalone output for deployment: copy real files (pnpm symlinks -> dereferenced).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STANDALONE=".next/standalone"
if [[ ! -d "$STANDALONE" ]]; then
  echo "pack-standalone: missing $STANDALONE — run next build first" >&2
  exit 1
fi

resolve_src() {
  if [[ -f "$STANDALONE/apps/main-next/server.js" ]]; then
    echo "$STANDALONE/apps/main-next"
  elif [[ -f "$STANDALONE/server.js" ]]; then
    echo "$STANDALONE"
  else
    local found
    found="$(find "$STANDALONE" -name server.js -type f 2>/dev/null | head -1 || true)"
    if [[ -n "$found" ]]; then
      dirname "$found"
    fi
  fi
}

SRC="$(resolve_src)"
if [[ -z "${SRC:-}" || ! -f "$SRC/server.js" ]]; then
  echo "pack-standalone: could not find server.js under $STANDALONE" >&2
  exit 1
fi

rm -rf .release
mkdir -p .release/.next
# -L: follow symlinks so pnpm .pnpm store paths become real files on the deploy host
cp -R -L "$SRC"/. .release/
cp -R -L .next/static .release/.next/static
cp -R -L public .release/public

if [[ ! -f .release/server.js ]]; then
  echo "pack-standalone: .release/server.js missing" >&2
  exit 1
fi

echo "pack-standalone: ok -> $ROOT/.release"
