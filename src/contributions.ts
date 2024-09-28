import axios from 'axios'
import { API_BASE_URL, handleApiError } from '../bin/helpers.js'
import { Contribution, Host, Occurrence, Repository } from './types.js'

import _ from 'lodash'

const toCountByMetricName = (occurrences: Occurrence[]) =>
  _.mapValues(_.groupBy(occurrences, 'metricName'), (occurrences) =>
    _.sum(occurrences.map((occurrence) => occurrence.value || 1))
  )

export const computeContributions = (occurrences: Occurrence[], previousOccurrences: Occurrence[]) => {
  const counts = toCountByMetricName(occurrences)
  const previousCounts = toCountByMetricName(previousOccurrences)

  const metrics = _.uniq(Object.keys(counts).concat(Object.keys(previousCounts)))
  const contributions: Contribution[] = []
  metrics.forEach((metric) => {
    const diff = (counts[metric] || 0) - (previousCounts[metric] || 0)
    if (diff !== 0) contributions.push({ metricName: metric, diff })
  })

  return contributions
}

export function buildCommitUrl(repository: Repository, sha: string) {
  if (repository.host === 'github.com')
    return `https://${repository.host}/${repository.owner}/${repository.name}/commit/${sha}`

  if (repository.host === 'gitlab.com')
    return `https://${repository.host}/${repository.owner}/${repository.name}/-/commit/${sha}`

  throw new Error(
    `Unsupported host: ${repository.host}
Supported hosts are: ${Object.values(Host).join(', ')}
If you use another provider, please open an issue at https://github.com/cherrypush/cherry-cli/issues`
  )
}

export const buildContributionsPayload = (
  projectName: string,
  authorName: string,
  authorEmail: string,
  sha: string,
  date: Date,
  contributions: Contribution[],
  repository: Repository
) => ({
  project_name: projectName,
  author_name: authorName,
  author_email: authorEmail,
  commit_sha: sha,
  commit_url: buildCommitUrl(repository, sha),
  commit_date: date.toISOString(),
  contributions: contributions.map((contribution) => ({
    metric_name: contribution.metricName,
    diff: contribution.diff,
  })),
})

export const uploadContributions = async (
  apiKey: string,
  projectName: string,
  authorName: string,
  authorEmail: string,
  sha: string,
  date: Date,
  contributions: Contribution[],
  repository: Repository
) =>
  handleApiError(() =>
    axios
      .post(
        API_BASE_URL + '/contributions',
        buildContributionsPayload(projectName, authorName, authorEmail, sha, date, contributions, repository),
        { params: { api_key: apiKey } }
      )
      .then(({ data }) => data)
  )
