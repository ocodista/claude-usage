import type { SessionInfo } from "../client/types"
import { metrics } from "./metrics"

interface CachedSession {
  session: SessionInfo
  mtime: number
  filePath: string
}

class SessionCache {
  private cache = new Map<string, CachedSession>()

  async get(sessionId: string, filePath: string): Promise<SessionInfo | null> {
    const cached = this.cache.get(sessionId)
    if (!cached) {
      metrics.recordCacheMiss()
      return null
    }

    // Check if file modified
    try {
      const stat = await Bun.file(filePath).stat()
      if (stat.mtime.getTime() !== cached.mtime) {
        metrics.recordCacheMiss()
        return null  // Cache invalid
      }

      metrics.recordCacheHit()
      return cached.session
    } catch {
      metrics.recordCacheMiss()
      return null
    }
  }

  set(sessionId: string, session: SessionInfo, filePath: string, mtime: number) {
    this.cache.set(sessionId, { session, mtime, filePath })
  }

  invalidate(sessionId: string) {
    this.cache.delete(sessionId)
  }

  clear() {
    this.cache.clear()
  }
}

export const sessionCache = new SessionCache()
