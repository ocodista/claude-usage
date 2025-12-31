import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import type { SessionInfo, StatsCache, TokenStats } from "../client/types"
import { sessionCache } from "./session-cache"

const CLAUDE_DIR = join(process.env.HOME ?? "", ".claude")
const STATS_FILE = join(CLAUDE_DIR, "stats-cache.json")
const PROJECTS_DIR = join(CLAUDE_DIR, "projects")
const HISTORY_FILE = join(CLAUDE_DIR, "history.jsonl")

interface ParseError {
  sessionId: string
  error: string
  timestamp: string
}

const parseErrors: ParseError[] = []

export function getParseErrors(): ParseError[] {
  return parseErrors.slice(-10)  // Last 10 errors
}

// Anthropic pricing per 1M tokens (as of Dec 2024)
const PRICING = {
  "claude-opus-4-5-20251101": { input: 15, output: 75, cacheRead: 1.875, cacheWrite: 18.75 },
  "claude-sonnet-4-5-20250929": { input: 3, output: 15, cacheRead: 0.30, cacheWrite: 3.75 },
  "claude-haiku-3-5-20241022": { input: 0.80, output: 4, cacheRead: 0.08, cacheWrite: 1 },
  default: { input: 3, output: 15, cacheRead: 0.30, cacheWrite: 3.75 },
}

function getPricing(model: string) {
  for (const [key, pricing] of Object.entries(PRICING)) {
    if (model.includes(key.split("-")[1] || key)) return pricing
  }
  return PRICING.default
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number = 0,
  cacheWriteTokens: number = 0
): number {
  const pricing = getPricing(model)
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output +
    (cacheReadTokens / 1_000_000) * pricing.cacheRead +
    (cacheWriteTokens / 1_000_000) * pricing.cacheWrite
  )
}

export async function parseStatsCache(): Promise<StatsCache | null> {
  try {
    const content = await readFile(STATS_FILE, "utf-8")
    return JSON.parse(content) as StatsCache
  } catch {
    return null
  }
}

interface HistoryEntry {
  display: string
  timestamp: number
  project: string
  sessionId: string
}

export async function parseHistoryFile(): Promise<Map<string, HistoryEntry>> {
  const sessionMap = new Map<string, HistoryEntry>()
  try {
    const content = await readFile(HISTORY_FILE, "utf-8")
    const lines = content.trim().split("\n")
    for (const line of lines) {
      if (!line) continue
      try {
        const entry = JSON.parse(line) as HistoryEntry
        if (entry.sessionId) {
          sessionMap.set(entry.sessionId, entry)
        }
      } catch {
        continue
      }
    }
  } catch {
    return sessionMap
  }
  return sessionMap
}

interface UsageData {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

interface MessageContent {
  model?: string
  usage?: UsageData
}

interface SessionMessage {
  type: string
  timestamp?: string
  message?: MessageContent
  gitBranch?: string
  cwd?: string
}

async function parseSessionFile(
  filePath: string,
  sessionId: string,
  projectDir: string,
  historyMap: Map<string, HistoryEntry>,
  currentSessionId: string | undefined,
  now: number
): Promise<SessionInfo | null> {
  try {
    const content = await readFile(filePath, "utf-8")
    const lines = content.trim().split("\n")

    let inputTokens = 0
    let outputTokens = 0
    let cacheReadTokens = 0
    let cacheWriteTokens = 0
    let messageCount = 0
    let model = ""
    let startTime = ""
    let lastActivity = ""
    let project = decodeURIComponent(projectDir).replace(/%/g, "/")
    let branch = ""
    const tokenTimeline: Array<{ timestamp: string; inputTokens: number; outputTokens: number; totalTokens: number }> = []

    for (const line of lines) {
      if (!line) continue
      try {
        const msg = JSON.parse(line) as SessionMessage
        messageCount++

        if (msg.timestamp) {
          if (!startTime) startTime = msg.timestamp
          lastActivity = msg.timestamp
        }

        if (msg.type === "assistant" && msg.message?.usage) {
          const usage = msg.message.usage
          inputTokens += usage.input_tokens ?? 0
          outputTokens += usage.output_tokens ?? 0
          cacheReadTokens += usage.cache_read_input_tokens ?? 0
          cacheWriteTokens += usage.cache_creation_input_tokens ?? 0

          // Record cumulative tokens at this timestamp
          if (msg.timestamp) {
            tokenTimeline.push({
              timestamp: msg.timestamp,
              inputTokens,
              outputTokens,
              totalTokens: inputTokens + outputTokens
            })
          }
        }

        if (msg.type === "assistant" && msg.message?.model && !model) {
          model = msg.message.model
        }

        if (msg.gitBranch && !branch) {
          branch = msg.gitBranch
        }
        if (msg.cwd && project.includes("%")) {
          project = msg.cwd
        }
      } catch {
        continue
      }
    }

    const historyEntry = historyMap.get(sessionId)
    if (historyEntry?.project) {
      project = historyEntry.project
    }

    if (messageCount > 0) {
      const costUSD = calculateCost(
        model || "default",
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheWriteTokens
      )

      const lastActivityTime = new Date(lastActivity).getTime()
      const isCurrentSession = currentSessionId
        ? sessionId === currentSessionId
        : (now - lastActivityTime) < 5 * 60 * 1000

      return {
        sessionId,
        project,
        branch: branch || undefined,
        messageCount,
        totalTokens: inputTokens + outputTokens,
        inputTokens,
        outputTokens,
        cacheTokens: cacheReadTokens,
        cacheWriteTokens,
        model: model || "unknown",
        startTime,
        lastActivity,
        costUSD,
        isCurrentSession,
        tokenTimeline: tokenTimeline.length > 0 ? tokenTimeline : undefined,
      }
    }

    return null
  } catch {
    return null
  }
}

export async function parseSessions(currentSessionId?: string): Promise<SessionInfo[]> {
  const sessions: SessionInfo[] = []
  const historyMap = await parseHistoryFile()
  const now = Date.now()

  try {
    const projectDirs = await readdir(PROJECTS_DIR)

    for (const projectDir of projectDirs) {
      const projectPath = join(PROJECTS_DIR, projectDir)
      try {
        const files = await readdir(projectPath)
        const jsonlFiles = files.filter(
          (f) => f.endsWith(".jsonl") && !f.startsWith("agent-")
        )

        for (const file of jsonlFiles) {
          const sessionId = file.replace(".jsonl", "")
          const filePath = join(projectPath, file)

          try {
            // Check cache first
            const stat = await Bun.file(filePath).stat()
            const cached = await sessionCache.get(sessionId, filePath)

            if (cached) {
              sessions.push(cached)
              continue
            }

            // Cache miss - parse file
            const session = await parseSessionFile(filePath, sessionId, projectDir, historyMap, currentSessionId, now)

            if (session) {
              sessionCache.set(sessionId, session, filePath, stat.mtime.getTime())
              sessions.push(session)
            }
          } catch (error) {
            // Log error but continue parsing other sessions
            const errorMsg = error instanceof Error ? error.message : String(error)
            parseErrors.push({
              sessionId,
              error: errorMsg,
              timestamp: new Date().toISOString()
            })
            console.error(`[Parser] Failed to parse session ${sessionId}:`, errorMsg)
            continue
          }
        }
      } catch {
        continue
      }
    }
  } catch {
    return sessions
  }

  return sessions.sort(
    (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  )
}

export interface MessageDetail {
  index: number
  type: "user" | "assistant" | "system"
  timestamp: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  cumulativeInput: number
  cumulativeOutput: number
  cumulativeTotal: number
  model?: string
  preview?: string
  toolsUsed?: string[]
}

export interface SessionDetail {
  sessionId: string
  project: string
  branch?: string
  model: string
  startTime: string
  lastActivity: string
  messages: MessageDetail[]
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheWriteTokens: number
  costUSD: number
}

interface FullSessionMessage {
  type: string
  timestamp?: string
  message?: {
    model?: string
    content?: Array<{ type: string; text?: string; name?: string }>
    usage?: UsageData
  }
  gitBranch?: string
  cwd?: string
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  const historyMap = await parseHistoryFile()

  try {
    const projectDirs = await readdir(PROJECTS_DIR)

    for (const projectDir of projectDirs) {
      const projectPath = join(PROJECTS_DIR, projectDir)
      const filePath = join(projectPath, `${sessionId}.jsonl`)

      try {
        const content = await readFile(filePath, "utf-8")
        const lines = content.trim().split("\n")

        const messages: MessageDetail[] = []
        let cumulativeInput = 0
        let cumulativeOutput = 0
        let cumulativeCacheRead = 0
        let cumulativeCacheWrite = 0
        let model = ""
        let startTime = ""
        let lastActivity = ""
        let project = decodeURIComponent(projectDir).replace(/%/g, "/")
        let branch = ""
        let messageIndex = 0

        for (const line of lines) {
          if (!line) continue
          try {
            const msg = JSON.parse(line) as FullSessionMessage

            if (msg.timestamp) {
              if (!startTime) startTime = msg.timestamp
              lastActivity = msg.timestamp
            }

            if (msg.gitBranch && !branch) {
              branch = msg.gitBranch
            }

            if (msg.type === "user" || msg.type === "assistant") {
              const usage = msg.message?.usage
              const inputTokens = usage?.input_tokens ?? 0
              const outputTokens = usage?.output_tokens ?? 0
              const cacheReadTokens = usage?.cache_read_input_tokens ?? 0
              const cacheWriteTokens = usage?.cache_creation_input_tokens ?? 0

              // Calculate per-message tokens (delta from previous cumulative)
              const msgInputTokens = inputTokens > 0 ? inputTokens - cumulativeInput : 0
              const msgOutputTokens = outputTokens > 0 ? outputTokens - cumulativeOutput : 0
              const msgCacheRead = cacheReadTokens > 0 ? cacheReadTokens - cumulativeCacheRead : 0
              const msgCacheWrite = cacheWriteTokens > 0 ? cacheWriteTokens - cumulativeCacheWrite : 0

              // Update cumulative if we have usage data
              if (usage) {
                cumulativeInput = inputTokens
                cumulativeOutput = outputTokens
                cumulativeCacheRead = cacheReadTokens
                cumulativeCacheWrite = cacheWriteTokens
              }

              // Get message preview
              let preview = ""
              let toolsUsed: string[] = []

              if (msg.message?.content && Array.isArray(msg.message.content)) {
                for (const block of msg.message.content) {
                  if (block.type === "text" && block.text && !preview) {
                    preview = block.text.slice(0, 200) + (block.text.length > 200 ? "..." : "")
                  }
                  if (block.type === "tool_use" && block.name) {
                    toolsUsed.push(block.name)
                  }
                }
              }

              if (msg.type === "assistant" && msg.message?.model && !model) {
                model = msg.message.model
              }

              messages.push({
                index: messageIndex++,
                type: msg.type as "user" | "assistant",
                timestamp: msg.timestamp || "",
                inputTokens: msgInputTokens > 0 ? msgInputTokens : (msg.type === "assistant" ? inputTokens : 0),
                outputTokens: msgOutputTokens > 0 ? msgOutputTokens : outputTokens,
                cacheReadTokens: msgCacheRead > 0 ? msgCacheRead : cacheReadTokens,
                cacheWriteTokens: msgCacheWrite > 0 ? msgCacheWrite : cacheWriteTokens,
                cumulativeInput: cumulativeInput,
                cumulativeOutput: cumulativeOutput,
                cumulativeTotal: cumulativeInput + cumulativeOutput,
                model: msg.type === "assistant" ? msg.message?.model : undefined,
                preview,
                toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined
              })
            }
          } catch {
            continue
          }
        }

        const historyEntry = historyMap.get(sessionId)
        if (historyEntry?.project) {
          project = historyEntry.project
        }

        if (messages.length > 0) {
          const costUSD = calculateCost(
            model || "default",
            cumulativeInput,
            cumulativeOutput,
            cumulativeCacheRead,
            cumulativeCacheWrite
          )

          return {
            sessionId,
            project,
            branch: branch || undefined,
            model: model || "unknown",
            startTime,
            lastActivity,
            messages,
            totalInputTokens: cumulativeInput,
            totalOutputTokens: cumulativeOutput,
            totalCacheReadTokens: cumulativeCacheRead,
            totalCacheWriteTokens: cumulativeCacheWrite,
            costUSD
          }
        }
      } catch {
        continue
      }
    }
  } catch {
    return null
  }

  return null
}

export async function getTokenStats(): Promise<TokenStats> {
  const stats = await parseStatsCache()
  const sessions = await parseSessions()

  // Calculate total and today's cost from sessions
  const today = new Date().toISOString().split("T")[0]
  let totalCostUSD = 0
  let todayCostUSD = 0
  let currentSession: SessionInfo | null = null

  for (const session of sessions) {
    totalCostUSD += session.costUSD
    if (session.lastActivity.startsWith(today)) {
      todayCostUSD += session.costUSD
    }
    if (session.isCurrentSession && !currentSession) {
      currentSession = session
    }
  }

  // Build hourly activity from session timestamps
  const hourlyActivity: Array<{ hour: number; day: number; count: number }> = []
  const hourDayMap = new Map<string, number>()

  // Aggregate message activity by day of week and hour from sessions
  for (const session of sessions) {
    if (!session.startTime) continue
    const date = new Date(session.startTime)
    const day = date.getDay() // 0-6 (Sunday-Saturday)
    const hour = date.getHours() // 0-23
    const key = `${day}-${hour}`
    hourDayMap.set(key, (hourDayMap.get(key) || 0) + session.messageCount)
  }

  for (const [key, count] of hourDayMap) {
    const [dayStr, hourStr] = key.split("-")
    hourlyActivity.push({
      day: parseInt(dayStr, 10),
      hour: parseInt(hourStr, 10),
      count
    })
  }

  if (!stats) {
    return {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
      cacheEfficiency: 0,
      totalSessions: 0,
      totalMessages: 0,
      totalCostUSD,
      todayCostUSD,
      modelUsage: {},
      dailyActivity: [],
      dailyModelTokens: [],
      hourlyActivity,
      sessions,
      currentSession,
    }
  }

  let totalInput = 0
  let totalOutput = 0
  let totalCacheRead = 0
  let totalCacheCreation = 0

  // Calculate model usage with costs
  const modelUsageWithCost: Record<string, typeof stats.modelUsage[string]> = {}
  for (const [model, usage] of Object.entries(stats.modelUsage)) {
    totalInput += usage.inputTokens
    totalOutput += usage.outputTokens
    totalCacheRead += usage.cacheReadInputTokens
    totalCacheCreation += usage.cacheCreationInputTokens

    const costUSD = calculateCost(
      model,
      usage.inputTokens,
      usage.outputTokens,
      usage.cacheReadInputTokens,
      usage.cacheCreationInputTokens
    )

    modelUsageWithCost[model] = {
      ...usage,
      costUSD,
    }
  }

  const totalTokens = totalInput + totalOutput
  const totalWithCache = totalTokens + totalCacheRead + totalCacheCreation
  const cacheEfficiency = totalWithCache > 0 ? (totalCacheRead / totalWithCache) * 100 : 0

  // Only keep timeline data for the 10 most recent sessions to limit payload size
  const sessionsWithLimitedTimeline = sessions.map((session, index) => {
    if (index < 10 && session.tokenTimeline) {
      return session
    }
    // Remove timeline for older sessions
    const { tokenTimeline, ...sessionWithoutTimeline } = session
    return sessionWithoutTimeline as typeof session
  })

  return {
    totalTokens,
    inputTokens: totalInput,
    outputTokens: totalOutput,
    cacheReadTokens: totalCacheRead,
    cacheCreationTokens: totalCacheCreation,
    cacheEfficiency,
    totalSessions: stats.totalSessions,
    totalMessages: stats.totalMessages,
    totalCostUSD,
    todayCostUSD,
    modelUsage: modelUsageWithCost,
    dailyActivity: stats.dailyActivity,
    dailyModelTokens: stats.dailyModelTokens,
    hourlyActivity,
    sessions: sessionsWithLimitedTimeline,
    currentSession,
  }
}
