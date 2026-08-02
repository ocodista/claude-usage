#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="Claude Usage"
APP_DIR="$ROOT/dist/$APP_NAME.app"
CONTENTS="$APP_DIR/Contents"
BUILD_DIR="$ROOT/.build/macos-app"

cd "$ROOT"

printf 'Installing JavaScript dependencies…\n'
bun install --frozen-lockfile

printf 'Running Swift tests…\n'
swift test --package-path macos

printf 'Building the Claude usage engine…\n'
mkdir -p "$BUILD_DIR"
bun build src/cli.ts --compile --target=bun-darwin-arm64 --outfile="$BUILD_DIR/claude-code-usage"

printf 'Building the native menu-bar app…\n'
swift build -c release --package-path macos
SWIFT_BIN_DIR="$(swift build -c release --package-path macos --show-bin-path)"

rm -rf "$APP_DIR"
mkdir -p "$CONTENTS/MacOS" "$CONTENTS/Resources"
cp "$SWIFT_BIN_DIR/ClaudeUsageMenuBar" "$CONTENTS/MacOS/ClaudeUsageMenuBar"
cp "$BUILD_DIR/claude-code-usage" "$CONTENTS/Resources/claude-code-usage"
cp "$ROOT/macos/Resources/Info.plist" "$CONTENTS/Info.plist"

ICONSET="$BUILD_DIR/ClaudeUsage.iconset"
rm -rf "$ICONSET"
mkdir -p "$ICONSET"
swift "$ROOT/macos/Scripts/generate-icon.swift" "$ICONSET"
iconutil -c icns "$ICONSET" -o "$CONTENTS/Resources/ClaudeUsage.icns"

codesign --force --deep --sign - "$APP_DIR"

ditto -c -k --sequesterRsrc --keepParent "$APP_DIR" "$ROOT/dist/Claude-Usage-macOS.zip"
printf '\nBuilt:\n  %s\n  %s\n' "$APP_DIR" "$ROOT/dist/Claude-Usage-macOS.zip"
