#!/bin/bash
# Claude Code Usage - Uninstall Script
# https://github.com/ocodista/claude-usage

set -e

# Colors
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

APP_NAME="claude-code-usage"
INSTALL_DIR="/usr/local/bin"
BINARY_PATH="${INSTALL_DIR}/${APP_NAME}"

echo ""
echo -e "${BOLD}  ┌─────────────────────────────────────┐${NC}"
echo -e "${BOLD}  │                                     │${NC}"
echo -e "${BOLD}  │  ${CYAN}Claude Code Usage${NC}${BOLD}                  │${NC}"
echo -e "${BOLD}  │  ${DIM}Uninstaller${NC}${BOLD}                        │${NC}"
echo -e "${BOLD}  │                                     │${NC}"
echo -e "${BOLD}  └─────────────────────────────────────┘${NC}"
echo ""

if [ ! -f "$BINARY_PATH" ]; then
  echo -e "  ${RED}✗${NC} Not installed at ${BINARY_PATH}"
  echo ""
  exit 1
fi

echo -e "  ${DIM}Removing${NC}      ${BINARY_PATH}"

if [ ! -w "$INSTALL_DIR" ]; then
  sudo rm -f "$BINARY_PATH"
else
  rm -f "$BINARY_PATH"
fi

echo ""
echo -e "  ${GREEN}✓ Uninstalled successfully${NC}"
echo ""
echo -e "  ${DIM}Thanks for using Claude Code Usage!${NC}"
echo ""
