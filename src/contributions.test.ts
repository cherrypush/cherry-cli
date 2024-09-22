import { describe, expect, it } from 'vitest'
import { buildCommitUrl, buildContributionsPayload } from './contributions.js'
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

describe('buildContributionsPayload', () => {
  it('builds the payload', () => {
    const repository: Repository = { host: Host.Github, owner: 'upflow', name: 'upflow', subdir: 'frontend' }
    const date = new Date('2021-01-01T00:00:00Z')
    const contributions = [{ metricName: 'foo', diff: 42 }]
    expect(
      buildContributionsPayload(
        'Upflow frontend',
        'Quentin',
        'quentin@email.com',
        '9f09cf1',
        date,
        contributions,
        repository
      )
    ).toEqual({
      project_name: 'Upflow frontend',
      author_name: 'Quentin',
      author_email: 'quentin@email.com',
      commit_sha: '9f09cf1',
      commit_url: 'https://github.com/upflow/upflow/commit/9f09cf1',
      commit_date: '2021-01-01T00:00:00.000Z',
      contributions: [{ metric_name: 'foo', diff: 42 }],
    })
  })
})
