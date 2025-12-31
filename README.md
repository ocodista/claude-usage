# Claude Usage

Real-time token usage monitor for Claude Code.

Track your Claude Code sessions, analyze token consumption, and estimate API costs—all in a live dashboard.

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/ocodista/claude-usage/main/install.sh | bash
```

Or install manually:

```bash
git clone https://github.com/ocodista/claude-usage.git
cd claude-usage && bun install
```

## Usage

Start the dashboard:

```bash
bun run src/server/index.ts
```

Open http://localhost:3456

## Features

**Live Dashboard**
WebSocket-powered updates. See token usage change as you work.

**Cost Tracking**
Estimated costs by model. See cache savings and projected spending.

**Session Analytics**
Per-session breakdown with token timelines. Compare sessions side-by-side.

**Activity Insights**
Discover your most active days, peak hours, and usage patterns.

**Time Filtering**
Filter by last week, month, year-to-date, or custom date range.

**Project Grouping**
Sessions grouped by project folder. Track usage across codebases.

## How It Works

The monitor watches `~/.claude` for file changes, parses JSONL session data, and broadcasts updates via WebSocket.

See [docs/how-it-works.md](docs/how-it-works.md) for architecture details.

## Stack

Bun, TypeScript, React 18, ECharts, Three.js

## Privacy

All data stays local. No external connections. Your Claude usage data never leaves your machine.

## License

MIT
