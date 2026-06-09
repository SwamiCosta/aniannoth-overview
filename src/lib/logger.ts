type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function resolveConfiguredLevel(): LogLevel {
  const raw = import.meta.env.VITE_LOG_LEVEL as string | undefined
  if (raw && raw in LOG_LEVEL_PRIORITY) {
    return raw as LogLevel
  }
  return 'error'
}

function isEnabled(level: LogLevel): boolean {
  const configured = resolveConfiguredLevel()
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configured]
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (isEnabled('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (isEnabled('info')) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (isEnabled('warn')) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  error(message: string, ...args: unknown[]): void {
    if (isEnabled('error')) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  },
}
