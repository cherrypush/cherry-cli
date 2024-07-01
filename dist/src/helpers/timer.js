'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.warnsAboutLongRunningTasks = exports.executeWithTiming = void 0
const console_js_1 = require('./console.js')
let timers = {}
/**
 * Executes a provided function block and measures its execution time.
 * Logs a message if the execution time exceeds 2 seconds.
 *
 * @param {Function} codeBlock - The block of code to execute.
 * @returns {*} The result of the executed code block.
 */
function executeWithTiming(codeBlock, identifier) {
  return __awaiter(this, void 0, void 0, function* () {
    const startTime = performance.now()
    const result = yield codeBlock()
    const endTime = performance.now()
    const executionTime = endTime - startTime
    timers[identifier] = executionTime
    return result
  })
}
exports.executeWithTiming = executeWithTiming
/**
 * Logs a warning for each long running task.
 * A task is considered long running if it takes longer than the provided time limit.
 *
 * @param {number} timeLimitInMs - The time limit in milliseconds.
 */
function warnsAboutLongRunningTasks(timeLimitInMs) {
  for (const [identifier, executionTime] of Object.entries(timers).sort()) {
    if (executionTime > timeLimitInMs) {
      ;(0, console_js_1.warn)(`${identifier} took ${Math.round(executionTime)}ms`)
    }
  }
}
exports.warnsAboutLongRunningTasks = warnsAboutLongRunningTasks
