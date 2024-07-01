'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.panic = void 0
const panic = (message) => {
  console.error(`❌ ${message}`)
  process.exit(1)
}
exports.panic = panic
