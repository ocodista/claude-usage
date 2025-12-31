type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
}

class Logger {
  log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    }

    console.log(JSON.stringify(entry))
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context)
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context)
  }
}

export const logger = new Logger()
