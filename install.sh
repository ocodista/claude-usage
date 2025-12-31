#!/bin/bash
# Claude Usage Dashboard installer
# Usage: curl -fsSL https://raw.githubusercontent.com/ocodista/claude-usage/main/install.sh | bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "  Claude Usage Dashboard"
echo "  ======================"
echo ""

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  darwin) OS="darwin" ;;
  linux) OS="linux" ;;
  mingw*|msys*|cygwin*) OS="windows" ;;
  *)
    echo -e "${RED}Unsupported OS: $OS${NC}"
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *)
    echo -e "${RED}Unsupported architecture: $ARCH${NC}"
    exit 1
    ;;
esac

echo -e "  Platform: ${GREEN}${OS}-${ARCH}${NC}"
echo ""

# Get latest release version
echo "  Fetching latest version..."
VERSION=$(curl -s https://api.github.com/repos/ocodista/claude-usage/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')

if [ -z "$VERSION" ]; then
  echo -e "${RED}Could not fetch latest version${NC}"
  exit 1
fi

echo -e "  Version: ${GREEN}v${VERSION}${NC}"
echo ""

# Build binary name
if [ "$OS" = "windows" ]; then
  BINARY="claude-usage-${OS}-${ARCH}.exe"
else
  BINARY="claude-usage-${OS}-${ARCH}"
fi

DOWNLOAD_URL="https://github.com/ocodista/claude-usage/releases/download/v${VERSION}/${BINARY}"

echo "  Downloading binary..."
curl -fsSL "$DOWNLOAD_URL" -o /tmp/claude-usage

# Install to /usr/local/bin
INSTALL_DIR="/usr/local/bin"
if [ ! -w "$INSTALL_DIR" ]; then
  echo -e "  ${YELLOW}Need sudo to install to ${INSTALL_DIR}${NC}"
  sudo mv /tmp/claude-usage "$INSTALL_DIR/claude-usage"
  sudo chmod +x "$INSTALL_DIR/claude-usage"
else
  mv /tmp/claude-usage "$INSTALL_DIR/claude-usage"
  chmod +x "$INSTALL_DIR/claude-usage"
fi

echo ""
echo -e "  ${GREEN}✓ Installed successfully${NC}"
echo ""
echo "  Starting dashboard..."
echo ""

# Open browser based on OS
open_browser() {
  case "$OS" in
    darwin) open "http://localhost:3190" ;;
    linux) xdg-open "http://localhost:3190" 2>/dev/null || true ;;
    windows) start "http://localhost:3190" 2>/dev/null || true ;;
  esac
}

# Start server and open browser
open_browser &
exec claude-usage start
