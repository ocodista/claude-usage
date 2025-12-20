import { getTokenStats, getSessionDetail } from "./parser"
import { createWatcher } from "./watcher"

const PORT = 3456
const clients = new Set<{ send: (data: string) => void }>()

async function broadcastUpdate() {
  const stats = await getTokenStats()
  const message = JSON.stringify({ type: "stats_update", data: stats })
  for (const client of clients) {
    try {
      client.send(message)
    } catch {
      clients.delete(client)
    }
  }
}

createWatcher(() => {
  console.log("[Watcher] Change detected, broadcasting update...")
  broadcastUpdate()
})

const HTML = await Bun.file(import.meta.dir + "/../client/index.html").text()

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url)

    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req)
      if (!upgraded) {
        return new Response("WebSocket upgrade failed", { status: 400 })
      }
      return undefined
    }

    if (url.pathname === "/api/stats") {
      const stats = await getTokenStats()
      return Response.json(stats)
    }

    // Session detail endpoint: /api/session/:id
    if (url.pathname.startsWith("/api/session/")) {
      const sessionId = url.pathname.replace("/api/session/", "")
      if (!sessionId) {
        return Response.json({ error: "Session ID required" }, { status: 400 })
      }
      const detail = await getSessionDetail(sessionId)
      if (!detail) {
        return Response.json({ error: "Session not found" }, { status: 404 })
      }
      return Response.json(detail)
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML, {
        headers: { "Content-Type": "text/html" },
      })
    }

    return new Response("Not found", { status: 404 })
  },
  websocket: {
    async open(ws) {
      clients.add(ws)
      console.log(`[WebSocket] Client connected (${clients.size} total)`)
      const stats = await getTokenStats()
      ws.send(JSON.stringify({ type: "initial", data: stats }))
    },
    message() {},
    close(ws) {
      clients.delete(ws)
      console.log(`[WebSocket] Client disconnected (${clients.size} total)`)
    },
  },
})

console.log(`
  Claude Code Token Monitor

  Server running at http://localhost:${PORT}
  Watching ~/.claude for changes...

  Press Ctrl+C to stop
`)
