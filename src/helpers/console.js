const YELLOW = '\x1B[33m'
const RESET = '\x1B[0m'

export function warn(message) {
  console.warn(`${YELLOW}⚠️ ${message}${RESET}`)
}
