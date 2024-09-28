import { describe, expect, it } from 'vitest'
import { buildPermalink, guessRepositoryInfo, guessRepositorySubdir } from './repository.js'

describe('buildPermalink', () => {
  it('builds a permalink with a custom function', () => {
    const permalink = ({ filePath, lineNumber }) =>
      `https://gitlab.com/cherrypush/cherry-cli/blob/HEAD/${filePath}${lineNumber ? `#L${lineNumber}` : ''}`

    const projectName = 'cherrypush/cherry-cli'
    const filePath = 'src/permalink.js'
    const lineNumber = 1

    const result = buildPermalink(permalink, projectName, filePath, lineNumber)

    expect(result).toBe('https://gitlab.com/cherrypush/cherry-cli/blob/HEAD/src/permalink.js#L1')
  })
})

describe('guessRepositoryInfo', () => {
  it('works for github ssh remotes', async () => {
    const result = await guessRepositoryInfo({
      remoteUrl: 'git@github.com:cherrypush/cherry-cli.git',
      configFile: '/Users/fwuensche/projects/cherry-cli/another/subdir/config.js',
      projectRoot: '/Users/fwuensche/projects/cherry-cli',
    })

    expect(result.host).toEqual('github.com')
    expect(result.owner).toEqual('cherrypush')
    expect(result.name).toEqual('cherry-cli')
    expect(result.subdir).toEqual('another/subdir')
  })

  it('works for github https remotes', async () => {
    const result = await guessRepositoryInfo({
      remoteUrl: 'https://github.com/cherrypush/cherry-cli.git',
      configFile: '/Users/fwuensche/projects/cherry-cli/another/subdir/config.js',
      projectRoot: '/Users/fwuensche/projects/cherry-cli',
    })

    expect(result.host).toEqual('github.com')
    expect(result.owner).toEqual('cherrypush')
    expect(result.name).toEqual('cherry-cli')
    expect(result.subdir).toEqual('another/subdir')
  })
})

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
