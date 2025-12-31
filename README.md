# Claude Usage

Real-time token usage monitor for Claude Code.

Track sessions, analyze token consumption, estimate API costs—live dashboard.

## Install

### Option 1: One-liner (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/ocodista/claude-usage/main/install.sh | bash
```

Opens the dashboard automatically after install.

### Option 2: Clone from source

```bash
git clone https://github.com/ocodista/claude-usage.git
cd claude-usage && bun install
bun run src/server/index.ts
```

Open http://localhost:3190

## Features

**Live Dashboard** — WebSocket-powered updates as you work.

**Cost Tracking** — Per-model costs with cache savings.

**Session Analytics** — Token timelines and session comparisons.

**Activity Insights** — Peak hours, active days, usage patterns.

**Time Filtering** — Week, month, year-to-date, or custom range.

**Project Grouping** — Sessions organized by codebase.

## How It Works

Watches `~/.claude` for file changes, parses JSONL session data, broadcasts via WebSocket.

See [docs/how-it-works.md](docs/how-it-works.md) for architecture.

## Stack

Bun, TypeScript, React 18, ECharts, Three.js

## Privacy

All data stays local. No external connections.

## License

MIT
