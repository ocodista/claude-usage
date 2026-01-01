#!/bin/bash
# Claude Usage - Install Script
# https://github.com/ocodista/claude-usage

set -e

# Colors
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# App info
APP_NAME="claude-usage"
REPO="ocodista/claude-usage"
INSTALL_DIR="/usr/local/bin"

echo ""
echo -e "${BOLD}Claude Usage${NC} ${DIM}— Token Dashboard for Claude Code${NC}"
echo ""

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  darwin) OS_NAME="macOS" ;;
  linux) OS_NAME="Linux" ;;
  mingw*|msys*|cygwin*) OS="windows"; OS_NAME="Windows" ;;
  *)
    echo -e "${RED}✗${NC} Unsupported OS: $OS"
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64|amd64) ARCH="x64"; ARCH_NAME="x64" ;;
  arm64|aarch64) ARCH="arm64"; ARCH_NAME="ARM64" ;;
  *)
    echo -e "${RED}✗${NC} Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

echo -e "  ${DIM}Platform${NC}    ${OS_NAME} ${ARCH_NAME}"

# Get latest release version
echo -e "  ${DIM}Fetching${NC}    latest release..."
VERSION=$(curl -s https://api.github.com/repos/${REPO}/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')

if [ -z "$VERSION" ]; then
  echo -e "${RED}✗${NC} Could not fetch latest version"
  exit 1
fi

echo -e "  ${DIM}Version${NC}     v${VERSION}"

# Build binary name
if [ "$OS" = "windows" ]; then
  BINARY="${APP_NAME}-${OS}-${ARCH}.exe"
else
  BINARY="${APP_NAME}-${OS}-${ARCH}"
fi

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/${BINARY}"

# Download
echo -e "  ${DIM}Downloading${NC} ${BINARY}..."
curl -fsSL "$DOWNLOAD_URL" -o /tmp/${APP_NAME}

# Install
echo -e "  ${DIM}Installing${NC}  ${INSTALL_DIR}/${APP_NAME}"

if [ ! -w "$INSTALL_DIR" ]; then
  sudo mv /tmp/${APP_NAME} "${INSTALL_DIR}/${APP_NAME}"
  sudo chmod +x "${INSTALL_DIR}/${APP_NAME}"
else
  mv /tmp/${APP_NAME} "${INSTALL_DIR}/${APP_NAME}"
  chmod +x "${INSTALL_DIR}/${APP_NAME}"
fi

echo ""
echo -e "${GREEN}✓${NC} ${BOLD}Installed successfully${NC}"
echo ""
echo -e "  ${DIM}Binary${NC}      ${INSTALL_DIR}/${APP_NAME}"
echo -e "  ${DIM}Run${NC}         ${CYAN}${APP_NAME} start${NC}"
echo ""
echo -e "${DIM}Starting dashboard...${NC}"
echo ""

# Open browser based on OS
case "$OS" in
  darwin) open "http://localhost:3190" 2>/dev/null & ;;
  linux) xdg-open "http://localhost:3190" 2>/dev/null & ;;
  windows) start "http://localhost:3190" 2>/dev/null & ;;
esac

# Start the app
exec ${APP_NAME} start
