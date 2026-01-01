
# Claude Code Usage
![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff)
![TypeScript](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)

A live dashboard that reads Claude Code’s local files, tracks token usage by project and session, and estimates what you would pay using API pricing.

https://github.com/user-attachments/assets/9efc6ab9-0461-49a2-9c44-9bdab2903824

---

## What it does

* Measures input, output, and cache tokens per session and project
* Shows activity peaks by hour, day, and time range
* Estimates API equivalent cost, including cache savings
* Updates live while you work
* Never inspects content, only volume and time ⌛️

---

## How it works
```mermaid
sequenceDiagram
autonumber

box Backend
participant Bun
participant Disk as ~/.claude/
end

box CLI
participant Claude as Claude Code CLI
end

box Frontend
participant React
end

Note over Bun: Startup
Bun->>Disk: Chokidar subscribes to file events

Note over Claude: User Chat
Claude->>Disk: Persist session changes

Note over Bun,React: File Change Callback
Disk-->>Bun: Chokidar triggers callback
Bun->>Disk: Re-read & parse files
Bun->>React: Broadcast via WebSocket
```

* Watches `~/.claude` for file changes (using [Chokidar](https://github.com/paulmillr/chokidar))
* Parses Claude JSONL session logs
* Aggregates usage in memory
* Streams updates to a local React dashboard using WebSocket

More details in [docs/how-it-works.md](docs/how-it-works.md).

---
## Install

```bash
curl -fsSL https://ocodista.com/claude-usage-install.sh | bash
```

## Run

```bash
claude-code-usage
```

Opens at [http://localhost:3190](http://localhost:3190)

---

## Uninstall

```bash
curl -fsSL https://ocodista.com/claude-usage-uninstall.sh | bash
```

---

## Privacy

All data stays on your machine.
This tool reads files Claude already wrote.

---

## License

MIT
