'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const child_process_1 = __importDefault(require('child_process'))
const log_js_1 = require('./log.js')
// From https://stackoverflow.com/a/68958420/9847645, to avoid 200Kb limit causing ENOBUFS errors for large output
const sh = (cmd, { throwOnError = true } = {}) =>
  new Promise((resolve, reject) => {
    ;(0, log_js_1.debug)('#', cmd)
    const [command, ...args] = cmd.split(/\s+/)
    const spawnedProcess = child_process_1.default.spawn(command, args)
    let stdout = ''
    let stderr = ''
    spawnedProcess.stdout.on('data', (chunk) => (stdout += chunk.toString()))
    spawnedProcess.stderr.on('data', (chunk) => (stderr += chunk.toString()))
    spawnedProcess.on('close', (code) => {
      if (throwOnError && code > 0) return reject(new Error(`${stderr} (Failed Instruction: ${cmd})`))
      ;(0, log_js_1.debug)(stdout)
      resolve({ stderr, stdout })
    })
    spawnedProcess.on('error', (err) => reject(err))
  })
exports.default = sh
