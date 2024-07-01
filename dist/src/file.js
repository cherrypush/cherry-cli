'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.isDirectory = void 0
const fs_1 = __importDefault(require('fs'))
const isDirectory = (path) => {
  try {
    return fs_1.default.statSync(path).isDirectory()
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}
exports.isDirectory = isDirectory
