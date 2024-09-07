import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { guessProjectName } from './git.js'
import path from 'path'

const originalCwd = process.cwd()
const fakeProjectPath = path.join(originalCwd, 'test/fixtures/project-one')

describe('guessProjectName', () => {
  beforeAll(() => process.chdir(fakeProjectPath)) // Change to `test/fixtures/project-one`
  afterAll(() => process.chdir(originalCwd)) // Change back to the original working directory

  it('returns an empty string if no pattern is recognized', async () => {
    expect(guessProjectName(null)).toBe('')
    expect(guessProjectName('')).toBe('')
    expect(guessProjectName('../fake-remote')).toBe('')
  })

  it('works for https remotes', () => {
    expect(guessProjectName('https://github.com/cherrypush/cherry-cli.git')).toBe('cherrypush/cherry-cli')
  })

  it('works for ssh remotes', () => {
    expect(guessProjectName('git@github.com:cherrypush/cherry-cli.git')).toBe('cherrypush/cherry-cli')
  })
})
