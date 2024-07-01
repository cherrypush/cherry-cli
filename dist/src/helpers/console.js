'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.warn = void 0
const YELLOW = '\x1B[33m'
const RESET = '\x1B[0m'
function warn(message) {
  console.warn(`${YELLOW}⚠️ ${message}${RESET}`)
}
exports.warn = warn
