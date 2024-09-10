import { warn } from './console.js'

const timers: Record<string, number> = {}

/**
 * Executes a provided function block and measures its execution time.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeWithTiming(codeBlock: any, identifier: string) {
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
export function warnsAboutLongRunningTasks(timeLimitInMs: number) {
  for (const [identifier, executionTime] of Object.entries(timers).sort()) {
    if (executionTime > timeLimitInMs) {
      warn(`${identifier} took ${Math.round(executionTime)}ms`)
    }
  }
}
