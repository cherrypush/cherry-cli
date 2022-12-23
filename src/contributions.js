import mapValues from 'lodash/mapValues.js'
import groupBy from 'lodash/groupBy.js'
import * as git from './git.js'
import { findOccurrences } from './occurences.js'
import { buildFilesAtSha } from './files.js'
import uniq from 'lodash/uniq.js'

const getOccurencesCount = async (configuration, paths, sha) => {
  const files = await buildFilesAtSha(paths, sha)
  const occurrences = await findOccurrences({ configuration, files })
  return mapValues(groupBy(occurrences, 'metric_name'), (occurrences) => occurrences.length)
}

const getCurrentAndPrevious = async (configuration, currentSha, previousSha) => {
  const paths = await git.changedFiles(currentSha)
  return await Promise.all([
    getOccurencesCount(configuration, paths, currentSha),
    getOccurencesCount(configuration, paths, previousSha),
  ])
}

export const findContributors = async (configuration, beginSha, endSha) => {
  const commits = await git.getCommits(beginSha, endSha)
  let contributions = {}

  const promises = []
  for (let i = 0; i < commits.length - 1; i++) {
    const currentCommit = commits[i]
    const previousCommit = commits[i + 1]
    promises.push(
      getCurrentAndPrevious(configuration, currentCommit.sha, previousCommit.sha).then(([current, previous]) => {
        console.log(`Retrieving contributors for ${currentCommit.sha}`)
        const metrics = uniq(Object.keys(current).concat(Object.keys(previous)))
        metrics.forEach((metric) => {
          const author = `${currentCommit.authorName} <${currentCommit.authorEmail}>`
          const delta = (current[metric] || 0) - (previous[metric] || 0)
          if (delta !== 0) {
            contributions[metric] ||= {}
            contributions[metric][author] = (contributions[metric][author] || 0) + delta
          }
        })
      })
    )
  }
  await Promise.all(promises)
  console.log(contributions)
}
