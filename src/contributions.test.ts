import { describe, expect, it } from 'vitest'
import { buildCommitUrl } from './contributions.js'
import { Host, Repository } from './types.js'

describe('buildCommitUrl', () => {
  it('handles github projects', () => {
    const repository: Repository = { host: Host.Github, owner: 'foo', name: 'bar', subdir: '' }
    expect(buildCommitUrl(repository, '123')).toBe('https://github.com/foo/bar/commit/123')
  })

  it('handles gitlab projects', () => {
    const repository: Repository = { host: Host.Gitlab, owner: 'foo', name: 'bar', subdir: '' }
    expect(buildCommitUrl(repository, '123')).toBe('https://gitlab.com/foo/bar/-/commit/123')
  })

  it('throws an error for unsupported hosts', () => {
    // @ts-expect-error Testing an error case
    const repository: Repository = { host: 'unsupported.com', owner: 'foo', name: 'bar', subdir: '' }
    expect(() => buildCommitUrl(repository, '123')).toThrow(`Unsupported host: unsupported.com
Supported hosts are: github.com, gitlab.com`)
  })
})
