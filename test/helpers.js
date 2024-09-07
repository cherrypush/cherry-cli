import { exec } from 'child_process'
import { expect } from 'vitest'
import { promisify } from 'util'

export const execAsync = promisify(exec)

export const expectError = async (command) => {
  let error

  try {
    await execAsync(command)
  } catch (err) {
    error = err
  }

  expect(error).toBeDefined() // expect an error to be thrown
  expect(error.code).toBe(1) // expect the error code to be 1

  return error
}
