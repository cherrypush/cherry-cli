import mapValues from 'lodash/mapValues.js'
import groupBy from 'lodash/groupBy.js'
import * as git from './git.js'
import { findOccurrences } from './occurences.js'
import { buildFilesAtSha } from './files.js'
import uniq from 'lodash/uniq.js'
import pLimit from 'p-limit'

const getOccurencesCount = async (configuration, paths, sha) => {
  const files = await buildFilesAtSha(paths, sha)
  const occurrences = await findOccurrences({ configuration, files })
  return mapValues(groupBy(occurrences, 'metric_name'), (occurrences) => occurrences.length)
}

const getCommitContribution = async (configuration, currentCommit, previousCommit) => {
  const paths = await git.changedFiles(currentCommit.sha)
  const [current, previous] = await Promise.all([
    getOccurencesCount(configuration, paths, currentCommit.sha),
    getOccurencesCount(configuration, paths, previousCommit.sha),
  ])
  const metrics = uniq(Object.keys(current).concat(Object.keys(previous)))
  const deltaByMetric = {}

  metrics.forEach((metric) => {
    const delta = (current[metric] || 0) - (previous[metric] || 0)
    if (delta !== 0) deltaByMetric[metric] = delta
  })

  return {
    date: currentCommit.isoDate,
    authorName: currentCommit.authorName,
    authorEmail: currentCommit.authorEmail,
    sha: currentCommit.sha,
    metrics: deltaByMetric,
  }
}

export const findContributions = async (configuration, beginSha, endSha) => {
  const commits = await git.getCommits(beginSha, endSha)
  const promises = []
  // Avoid "Error: spawn EBADF" when invoking too many shell commands, limiting to 10 does not impact run time
  const limit = pLimit(10)

  for (let i = 0; i < commits.length - 1; i++) {
    const currentCommit = commits[i]
    const previousCommit = commits[i + 1]
    promises.push(limit(() => getCommitContribution(configuration, currentCommit, previousCommit)))
  }

  return await Promise.all(promises)
}
