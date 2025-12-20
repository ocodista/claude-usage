---
description: Start the Claude usage dashboard server
---

Start the token usage monitor dashboard by running the following command in the plugin directory:

```bash
cd $PLUGIN_DIR && bun run dev
```

After starting, open http://localhost:3456 in your browser to view the dashboard.

The dashboard shows:
- Real-time token usage with WebSocket updates
- Cost estimates by model (Opus, Sonnet, Haiku)
- Session analytics and per-message breakdown
- Interactive charts for usage trends
