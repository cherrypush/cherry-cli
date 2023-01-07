import mapValues from 'lodash/mapValues.js'
import groupBy from 'lodash/groupBy.js'
import * as git from './git.js'
import { findOccurrences } from './occurences.js'
import { getFilesAtSha } from './files.js'
import uniq from 'lodash/uniq.js'
import pLimit from 'p-limit'

const countOccurences = async (configuration, codeOwners, paths, sha) => {
  const files = await getFilesAtSha(paths, sha)
  const occurrences = await findOccurrences({ configuration, files, codeOwners })
  return mapValues(groupBy(occurrences, 'metric_name'), (occurrences) => occurrences.length)
}

const getCommitContribution = async (configuration, codeOwners, commit) => {
  const paths = await git.changedFiles(commit.sha)
  const previousSha = await git.previousSha(commit.sha)
  const [current, previous] = await Promise.all([
    countOccurences(configuration, codeOwners, paths, commit.sha),
    previousSha ? countOccurences(configuration, codeOwners, paths, previousSha) : {},
  ])
  const metrics = uniq(Object.keys(current).concat(Object.keys(previous)))
  const deltaByMetric = {}

  metrics.forEach((metric) => {
    const delta = (current[metric] || 0) - (previous[metric] || 0)
    if (delta !== 0) deltaByMetric[metric] = delta
  })

  return {
    date: commit.isoDate,
    authorName: commit.authorName,
    authorEmail: commit.authorEmail,
    sha: commit.sha,
    metrics: deltaByMetric,
  }
}

export const findContributions = async (configuration, codeOwners, beginSha) => {
  const commits = await git.getCommits(beginSha, 'HEAD')
  // Avoid "Error: spawn EBADF" when invoking too many shell commands, limiting to 10 does not impact run time
  const limit = pLimit(10)
  const contributions = commits.map((commit) => limit(() => getCommitContribution(configuration, codeOwners, commit)))

  return await Promise.all(contributions)
}
