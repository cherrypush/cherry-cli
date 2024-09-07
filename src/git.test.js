import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { guessProjectName } from './git.js'
import path from 'path'

// Partially mock the module
vi.mock('./git.js', async (importOriginal) => {
  const originalModule = await importOriginal() // Import the actual module
  return {
    ...originalModule, // Keep the original exports
    git: vi.fn(), // Mock only the `git` function
  }
})

// We have a fixture project in `test/fixtures/project_one` that we use to create test scenarios
const originalCwd = process.cwd()
const fixturesPath = path.join(originalCwd, 'test/fixtures/project_one')

describe('guessProjectName', () => {
  beforeAll(() => process.chdir(fixturesPath)) // Change to `test/fixtures/project_one`
  afterAll(() => process.chdir(originalCwd)) // Change back to the original working directory

  it('should return an empty string if no remotes are found', async () => {
    // TODO: It'd be better to improve guessProjectName to take url as a param, so we can test it without mocking git
    const { git } = await import('./git.js') // Import the mocked `git` function
    git.mockResolvedValueOnce([]) // Mock `git('remote')` to return an empty array
    const result = await guessProjectName()

    expect(result).toBe('cherrypush/project_one')
  })
})
