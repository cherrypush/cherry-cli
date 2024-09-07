import { describe, expect, it, vi } from 'vitest'

import { guessProjectName } from './git.js' // Import the function to test

// Partially mock the module
vi.mock('./git.js', async (importOriginal) => {
  const originalModule = await importOriginal() // Import the actual module
  return {
    ...originalModule, // Keep the original exports
    git: vi.fn(), // Mock only the `git` function
  }
})

describe('guessProjectName', () => {
  it('should return an empty string if no remotes are found', async () => {
    const { git } = await import('./git.js') // Import the mocked `git` function

    git.mockResolvedValueOnce([]) // Mock `git('remote')` to return an empty array
    const result = await guessProjectName()

    expect(result).toBe('cherrypush/cherry-cli')
  })
})
