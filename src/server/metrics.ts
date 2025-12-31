interface Metrics {
  uptime: number
  startTime: number
  connectedClients: number
  totalParses: number
  totalParseTimeMs: number
  avgParseTimeMs: number
  parseErrors: number
  lastUpdateAt: string | null
  cacheHits: number
  cacheMisses: number
}

class MetricsCollector {
  private metrics: Metrics = {
    uptime: 0,
    startTime: Date.now(),
    connectedClients: 0,
    totalParses: 0,
    totalParseTimeMs: 0,
    avgParseTimeMs: 0,
    parseErrors: 0,
    lastUpdateAt: null,
    cacheHits: 0,
    cacheMisses: 0
  }

  recordParse(durationMs: number) {
    this.metrics.totalParses++
    this.metrics.totalParseTimeMs += durationMs
    this.metrics.avgParseTimeMs = this.metrics.totalParseTimeMs / this.metrics.totalParses
    this.metrics.lastUpdateAt = new Date().toISOString()
  }

  recordError() {
    this.metrics.parseErrors++
  }

  recordCacheHit() {
    this.metrics.cacheHits++
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++
  }

  setConnectedClients(count: number) {
    this.metrics.connectedClients = count
  }

  getMetrics(): Metrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime
    }
  }

  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses
    return total > 0 ? (this.metrics.cacheHits / total) * 100 : 0
  }
}

export const metrics = new MetricsCollector()
