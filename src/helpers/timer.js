import { warn } from './console.js'

let timers = {}

/**
 * Executes a provided function block and measures its execution time.
 * Logs a message if the execution time exceeds 2 seconds.
 *
 * @param {Function} codeBlock - The block of code to execute.
 * @returns {*} The result of the executed code block.
 */
export async function executeWithTiming(codeBlock, identifier) {
  const startTime = performance.now()

  const result = await codeBlock()

  const endTime = performance.now()
  const executionTime = endTime - startTime

  timers[identifier] = executionTime

  return result
}

/**
 * Logs a warning for each long running task.
 * A task is considered long running if it takes longer than the provided time limit.
 *
 * @param {number} timeLimitInMs - The time limit in milliseconds.
 */
export function warnsAboutLongRunningTasks(timeLimitInMs) {
  for (const [identifier, executionTime] of Object.entries(timers).sort()) {
    if (executionTime > timeLimitInMs) {
      warn(`${identifier} took ${Math.round(executionTime)}ms`)
    }
  }
}
