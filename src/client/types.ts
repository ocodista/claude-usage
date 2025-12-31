export interface ModelUsage {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
  webSearchRequests: number
  costUSD: number
}

export interface DailyActivity {
  date: string
  messageCount: number
  sessionCount: number
  toolCallCount: number
}

export interface DailyModelTokens {
  date: string
  tokensByModel: Record<string, number>
}

export interface StatsCache {
  version: number
  lastComputedDate: string
  dailyActivity: DailyActivity[]
  dailyModelTokens: DailyModelTokens[]
  modelUsage: Record<string, ModelUsage>
  totalSessions: number
  totalMessages: number
  longestSession: {
    sessionId: string
    duration: number
    messageCount: number
    timestamp: string
  }
  firstSessionDate: string
  hourCounts: Record<string, number>
}

export interface TokenTimePoint {
  timestamp: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface SessionInfo {
  sessionId: string
  project: string
  branch?: string
  messageCount: number
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheTokens: number
  cacheWriteTokens: number
  model: string
  startTime: string
  lastActivity: string
  costUSD: number
  isCurrentSession: boolean
  tokenTimeline?: TokenTimePoint[]
}

export interface HourlyActivity {
  hour: number
  day: number
  count: number
}

export interface TokenStats {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  cacheEfficiency: number
  totalSessions: number
  totalMessages: number
  totalCostUSD: number
  todayCostUSD: number
  modelUsage: Record<string, ModelUsage>
  dailyActivity: DailyActivity[]
  dailyModelTokens: DailyModelTokens[]
  hourlyActivity: HourlyActivity[]
  sessions: SessionInfo[]
  currentSession: SessionInfo | null
}

export interface WebSocketMessage {
  type: "stats_update" | "session_update" | "initial"
  data: TokenStats
}

export type TimeRange = "daily" | "weekly" | "all"

export type TimeRangePreset = "1W" | "1M" | "YTD" | "All" | "custom"

export interface CustomDateRange {
  startDate: string // ISO 8601 date string
  endDate: string   // ISO 8601 date string
}

export interface TimeRangeState {
  preset: TimeRangePreset
  customRange?: CustomDateRange
}
