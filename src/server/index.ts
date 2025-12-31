import { getTokenStats, getSessionDetail, getParseErrors } from "./parser"
import { createWatcher } from "./watcher"
import { sessionCache } from "./session-cache"
import { basename } from "node:path"
import { metrics } from "./metrics"
import { logger } from "./logger"

const PORT = 3190 // C A I O
const clients = new Set<{ send: (data: string) => void }>()

async function broadcastUpdate() {
  const startTime = performance.now()
  const stats = await getTokenStats()
  const duration = performance.now() - startTime

  metrics.recordParse(duration)
  logger.info('Parse completed', { durationMs: parseFloat(duration.toFixed(2)) })

  const message = JSON.stringify({ type: "stats_update", data: stats })
  for (const client of clients) {
    try {
      client.send(message)
    } catch {
      clients.delete(client)
    }
  }
}

let isShuttingDown = false

const watcher = createWatcher((changedPath) => {
  if (isShuttingDown) return

  logger.info('File changed', { path: changedPath })

  // Invalidate cache for changed session
  if (changedPath.endsWith('.jsonl')) {
    const sessionId = basename(changedPath, '.jsonl')
    sessionCache.invalidate(sessionId)
  }

  // Broadcast update
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

    if (url.pathname === "/api/errors") {
      const errors = getParseErrors()
      return Response.json({ errors })
    }

    if (url.pathname === "/api/metrics") {
      const m = metrics.getMetrics()
      return Response.json({
        ...m,
        cacheHitRate: metrics.getCacheHitRate()
      })
    }

    if (url.pathname === "/health") {
      const m = metrics.getMetrics()
      const healthy = m.avgParseTimeMs < 100 && m.parseErrors < 10
      return Response.json({
        status: healthy ? "healthy" : "degraded",
        metrics: m
      }, { status: healthy ? 200 : 503 })
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
      metrics.setConnectedClients(clients.size)
      logger.info('WebSocket client connected', { totalClients: clients.size })
      const stats = await getTokenStats()
      ws.send(JSON.stringify({ type: "initial", data: stats }))
    },
    message() { },
    close(ws) {
      clients.delete(ws)
      metrics.setConnectedClients(clients.size)
      logger.info('WebSocket client disconnected', { totalClients: clients.size })
    },
  },
})

console.log(`
  Claude Code Token Monitor

  Server running at http://localhost:${PORT}
  Watching ~/.claude for changes...

  Press Ctrl+C to stop
`)

// Graceful shutdown handler
async function gracefulShutdown() {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info('Graceful shutdown initiated')

  // Stop accepting new connections
  watcher.close()

  // Notify all clients
  const closeMessage = JSON.stringify({ type: 'server_closing' })
  for (const client of clients) {
    try {
      client.send(closeMessage)
      client.close(1001, 'Server shutting down')
    } catch {
      // Ignore errors during shutdown
    }
  }

  // Wait for clients to disconnect (max 5s)
  const deadline = Date.now() + 5000
  while (clients.size > 0 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  logger.info('Graceful shutdown complete', {
    remainingClients: clients.size
  })

  process.exit(0)
}

// Register shutdown handlers
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
