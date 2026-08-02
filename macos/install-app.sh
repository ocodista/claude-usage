#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/dist/Claude Usage.app"
DESTINATION="$HOME/Applications/Claude Usage.app"

if [ ! -d "$SOURCE" ]; then
  "$ROOT/macos/build-app.sh"
fi

mkdir -p "$HOME/Applications"
rm -rf "$DESTINATION"
cp -R "$SOURCE" "$DESTINATION"
open "$DESTINATION"
printf 'Installed and opened %s\n' "$DESTINATION"
