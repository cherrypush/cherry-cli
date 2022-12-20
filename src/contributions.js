import mapValues from 'lodash/mapValues.js'
import groupBy from 'lodash/groupBy.js'
import * as git from './git.js'
import { findOccurrences } from './occurences.js'

// get commits to iterate git rev-list begin_sha..end_sha
// for each commit
//   find occurences
//   aggregate them by name
//   compare with most recent commit
//   increment contribution for commit author if metric changed

export const findContributors = async (configuration, beginSha, endSha) => {
  const commits = await git.getCommits(beginSha, endSha)
  const initialBranch = await git.branchName()
  let previousCounts
  let previousCommit
  let contributions = {}

  try {
    for (const commit of commits) {
      await git.checkout(commit.sha)
      const occurrences = await findOccurrences(configuration)
      const counts = mapValues(groupBy(occurrences, 'metric_name'), (occurrences) => occurrences.length)
      if (previousCounts)
        Object.entries(counts).forEach(([metric, count]) => {
          if (metric in previousCounts) {
            const author = `${previousCommit.authorName} <${previousCommit.authorEmail}>`
            const delta = previousCounts[metric] - count
            if (delta !== 0) {
              contributions[metric] ||= {}
              contributions[metric][author] = (contributions[metric][author] || 0) + delta
            }
          }
        })

      previousCounts = counts
      previousCommit = commit
    }
  } finally {
    await git.checkout(initialBranch)
  }
  console.log(contributions)
}
