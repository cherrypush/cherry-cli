import { describe, expect, it } from 'vitest'
import { guessProjectName, guessRepositoryInfo, guessRepositorySubdir } from './git.js'

describe('guessRepositorySubdir', () => {
  it('returns an empty string when no configuration file was retrieved', async () => {
    const result = guessRepositorySubdir({ configFile: null, projectRoot: '' })
    expect(result).toBe('')
  })

  it('returns empty string when the config file is on the root folder', async () => {
    const result = guessRepositorySubdir({
      configFile: '/Users/fwuensche/projects/cherry-cli/.cherry.js',
      projectRoot: '/Users/fwuensche/projects/cherry-cli',
    })
    expect(result).toBe('')
  })

  it('returns the path to the folder when the config file is within a subfolder', async () => {
    const result = guessRepositorySubdir({
      configFile: '/Users/fwuensche/projects/cherry-cli/another/subdir/config.js',
      projectRoot: '/Users/fwuensche/projects/cherry-cli',
    })
    expect(result).toBe('another/subdir')
  })
})

describe('guessProjectName', () => {
  it('raises an error if no remote URL is provided', () => {
    expect(() => guessProjectName(null)).toThrow()
  })

  it('returns an empty string if no pattern is recognized', async () => {
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

describe('guessRepositoryInfo', () => {
  it('works for github ssh remotes', async () => {
    const result = await guessRepositoryInfo({
      remoteUrl: 'git@github.com:cherrypush/cherry-cli.git',
      configFile: '/Users/fwuensche/projects/cherry-cli/another/subdir/config.js',
      projectRoot: '/Users/fwuensche/projects/cherry-cli',
    })

    expect(result.host).toEqual('github')
    expect(result.owner).toEqual('cherrypush')
    expect(result.name).toEqual('cherry-cli')
    expect(result.subdir).toEqual('another/subdir')
  })
})
