#!/bin/bash
# Claude Usage Dashboard installer
# Usage: curl -fsSL ocodista.com/claude-usage.sh | sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Claude Usage Dashboard Installer"
echo "================================="
echo ""

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  darwin)
    OS="darwin"
    ;;
  linux)
    OS="linux"
    ;;
  mingw*|msys*|cygwin*)
    OS="windows"
    ;;
  *)
    echo -e "${RED}Error: Unsupported OS: $OS${NC}"
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64|amd64)
    ARCH="x64"
    ;;
  arm64|aarch64)
    ARCH="arm64"
    ;;
  *)
    echo -e "${RED}Error: Unsupported architecture: $ARCH${NC}"
    exit 1
    ;;
esac

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}Bun runtime not found.${NC}"
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

echo -e "${GREEN}✓ Bun runtime found${NC}"

# Determine installation method
echo ""
echo "Select installation method:"
echo "1) NPM package (recommended)"
echo "2) Standalone binary"
echo "3) Clone from source"
echo ""
read -p "Enter choice [1-3]: " choice

case "$choice" in
  1)
    echo ""
    echo "Installing via NPM..."
    bun install -g @ocodista/claude-usage
    echo -e "${GREEN}✓ Installation complete!${NC}"
    echo ""
    echo "Run: claude-usage start"
    ;;
  2)
    echo ""
    echo "Installing standalone binary..."

    # Get latest release version
    VERSION=$(curl -s https://api.github.com/repos/ocodista/claude-usage/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')

    if [ -z "$VERSION" ]; then
      echo -e "${RED}Error: Could not fetch latest version${NC}"
      exit 1
    fi

    echo "Latest version: v$VERSION"

    # Build binary name
    if [ "$OS" = "windows" ]; then
      BINARY="claude-usage-${OS}-${ARCH}.exe"
    else
      BINARY="claude-usage-${OS}-${ARCH}"
    fi

    DOWNLOAD_URL="https://github.com/ocodista/claude-usage/releases/download/v${VERSION}/${BINARY}"

    echo "Downloading from: $DOWNLOAD_URL"

    # Download binary
    curl -fsSL "$DOWNLOAD_URL" -o /tmp/claude-usage

    # Install to /usr/local/bin
    INSTALL_DIR="/usr/local/bin"
    if [ ! -w "$INSTALL_DIR" ]; then
      echo "Need sudo permissions to install to $INSTALL_DIR"
      sudo mv /tmp/claude-usage "$INSTALL_DIR/claude-usage"
      sudo chmod +x "$INSTALL_DIR/claude-usage"
    else
      mv /tmp/claude-usage "$INSTALL_DIR/claude-usage"
      chmod +x "$INSTALL_DIR/claude-usage"
    fi

    echo -e "${GREEN}✓ Installation complete!${NC}"
    echo ""
    echo "Run: claude-usage start"
    ;;
  3)
    echo ""
    echo "Cloning from source..."

    # Check if git is installed
    if ! command -v git &> /dev/null; then
      echo -e "${RED}Error: Git is required but not installed${NC}"
      exit 1
    fi

    # Clone repository
    INSTALL_DIR="$HOME/.claude-usage"
    git clone https://github.com/ocodista/claude-usage.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"

    # Install dependencies
    bun install

    # Build client
    bun run build:client

    # Create symlink
    ln -sf "$INSTALL_DIR/src/cli.ts" /usr/local/bin/claude-usage

    echo -e "${GREEN}✓ Installation complete!${NC}"
    echo ""
    echo "Run: claude-usage start"
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

echo ""
echo "Documentation: https://github.com/ocodista/claude-usage"
echo "Blog post: https://ocodista.com/blog/claude-usage"
