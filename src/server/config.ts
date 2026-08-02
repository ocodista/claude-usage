export const SERVER_HOST = "127.0.0.1"
export const SERVER_PORT = 3190 // C A I O

export function isAllowedOrigin(origin: string | null): boolean {
  if (origin === null) return true

  try {
    const url = new URL(origin)
    const isLoopback = url.hostname === SERVER_HOST || url.hostname === "localhost"
    return url.protocol === "http:" && isLoopback && url.port === String(SERVER_PORT)
  } catch {
    return false
  }
}
