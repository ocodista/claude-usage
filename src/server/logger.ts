type LogLevel = 'info' | 'warn' | 'error'

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
}

const LEVEL_STYLES: Record<LogLevel, { color: string; label: string }> = {
  info: { color: COLORS.cyan, label: 'INFO' },
  warn: { color: COLORS.yellow, label: 'WARN' },
  error: { color: COLORS.red, label: 'ERROR' },
}

function formatTime(): string {
  const now = new Date()
  return `${COLORS.dim}${now.toLocaleTimeString()}${COLORS.reset}`
}

function formatContext(context?: Record<string, unknown>): string {
  if (!context || Object.keys(context).length === 0) return ''

  const parts = Object.entries(context).map(([key, value]) => {
    const formattedValue = typeof value === 'number'
      ? `${COLORS.magenta}${value}${COLORS.reset}`
      : `${COLORS.green}${value}${COLORS.reset}`
    return `${COLORS.dim}${key}=${COLORS.reset}${formattedValue}`
  })

  return ` ${parts.join(' ')}`
}

class Logger {
  log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const style = LEVEL_STYLES[level]
    const time = formatTime()
    const levelStr = `${style.color}${style.label}${COLORS.reset}`
    const contextStr = formatContext(context)

    console.log(`${time} ${levelStr} ${message}${contextStr}`)
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
