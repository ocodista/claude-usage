import { useEffect, useState, useCallback } from "react"
import type { TokenStats, WebSocketMessage } from "../types"

const INITIAL_STATS: TokenStats = {
  totalTokens: 0,
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
  cacheEfficiency: 0,
  totalSessions: 0,
  totalMessages: 0,
  modelUsage: {},
  dailyActivity: [],
  dailyModelTokens: [],
  sessions: [],
}

export function useTokenData() {
  const [stats, setStats] = useState<TokenStats>(INITIAL_STATS)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)

    ws.onopen = () => {
      setConnected(true)
      setError(null)
      console.log("[WebSocket] Connected")
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage
        if (message.type === "initial" || message.type === "stats_update") {
          setStats(message.data)
        }
      } catch (err) {
        console.error("[WebSocket] Parse error:", err)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      console.log("[WebSocket] Disconnected, reconnecting in 2s...")
      setTimeout(connect, 2000)
    }

    ws.onerror = () => {
      setError("Connection error")
      ws.close()
    }

    return ws
  }, [])

  useEffect(() => {
    const ws = connect()
    return () => ws.close()
  }, [connect])

  return { stats, connected, error }
}
