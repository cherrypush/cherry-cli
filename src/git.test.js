import { describe, expect, it } from 'vitest'

import { guessProjectName } from './git.js'

describe('guessProjectName', () => {
  it('returns an empty string if no pattern is recognized', async () => {
    expect(guessProjectName(null)).toBe(null)
    expect(guessProjectName('')).toBe(null)
    expect(guessProjectName('../fake-remote')).toBe(null)
  })

  it('works for https remotes', () => {
    expect(guessProjectName('https://github.com/cherrypush/cherry-cli.git')).toBe('cherrypush/cherry-cli')
  })

  it('works for ssh remotes', () => {
    expect(guessProjectName('git@github.com:cherrypush/cherry-cli.git')).toBe('cherrypush/cherry-cli')
  })
})
