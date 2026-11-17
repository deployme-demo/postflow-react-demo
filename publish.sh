#!/usr/bin/env bash
set -euo pipefail
REMOTE_URL="${1:-}"
if [[ -z "$REMOTE_URL" ]]; then
  echo "Usage: bash publish.sh https://github.com/YOUR_USERNAME/deployme-signalboard.git" >&2
  exit 2
fi
cd "$(dirname "$0")"
node --version
npm --version
npm install --package-lock-only --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org/
npm ci --no-audit --no-fund --registry=https://registry.npmjs.org/
npm run build
[ -s package-lock.json ] && [ -s dist/index.html ]

if [[ ! -d .git ]]; then git init; fi
git add .
if ! git diff --cached --quiet; then git commit -m "Add deployme-signalboard DeployMe demo"; fi
git branch -M main
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi
git push -u origin main
printf '\nPublished deployme-signalboard to %s\n' "$REMOTE_URL"
