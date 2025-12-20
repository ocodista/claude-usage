# Claude Usage

Real-time token usage monitor for Claude Code.

## Features

- **Live Dashboard** - WebSocket-powered real-time updates
- **Cost Tracking** - Estimated costs by model with cache savings
- **Session Analytics** - Per-session and per-message token breakdown
- **Interactive Charts** - Usage trends, model comparison, session race

## Quick Start

```bash
bun install
bun run dev
```

Open http://localhost:3456

## How It Works

Watches `~/.claude/` for changes and parses:
- `stats-cache.json` - Aggregated usage stats
- `projects/*/*.jsonl` - Session message history
- `history.jsonl` - Session metadata

## Tech Stack

Bun, React 18, TailwindCSS, Apache ECharts
