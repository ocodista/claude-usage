# Claude Usage

A Claude Code plugin for real-time token usage monitoring.

## Installation

```bash
# Clone the plugin
git clone https://github.com/ocodista/claude-usage.git

# Install dependencies
cd claude-usage && bun install

# Load with Claude Code
claude --plugin-dir /path/to/claude-usage
```

## Commands

| Command | Description |
|---------|-------------|
| `/claude-usage:start` | Start the dashboard server |
| `/claude-usage:stats` | Show quick token statistics |
| `/claude-usage:open` | Open dashboard in browser |

## Features

- **Live Dashboard** - WebSocket-powered real-time updates
- **Cost Tracking** - Estimated costs by model with cache savings
- **Session Analytics** - Per-session and per-message token breakdown
- **Interactive Charts** - Usage trends, model comparison, session race

## Dashboard

After running `/claude-usage:start`, open http://localhost:3456

## Tech Stack

Bun, React 18, TailwindCSS, Apache ECharts
