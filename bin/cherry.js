#! /usr/bin/env node

import dotenv from 'dotenv'
import axios from 'axios'
import { program } from 'commander'
import { aggregateOccurrences, findOccurrences } from '../src/occurences.js'
import { configurationExists, getConfiguration, createConfigurationFile } from '../src/configuration.js'
import prompt from 'prompt'
import groupBy from 'lodash/groupBy.js'
import { guessProjectName } from '../src/git.js'
import mapValues from 'lodash/mapValues.js'
import * as git from '../src/git.js'
import { addDays, substractDays, toISODate, nextMonth } from '../src/date.js'
import { panic } from '../src/error.js'
import { findContributions } from '../src/contributions.js'
import { getFiles } from '../src/files.js'
import { newContributionsProgress, newMetricsProgress } from '../src/progress.js'
import Codeowners from '../src/codeowners.js'
import difference from 'lodash/difference.js'
import { setVerboseMode } from '../src/log.js'

dotenv.config()

const API_BASE_URL = process.env.API_URL ?? 'https://www.cherrypush.com/api'

program.command('init').action(async () => {
  if (configurationExists()) {
    console.error('.cherry.js already exists.')
    process.exit(0)
  }

  prompt.message = ''
  prompt.start()
  const defaultProjectName = await guessProjectName()
  const { repo } = await prompt.get({
    properties: { repo: { message: 'Enter your project name', default: defaultProjectName, required: true } },
  })
  createConfigurationFile(repo)
  console.log('.cherry.js file successfully created! You can now run `cherry run` to test it')
})

program
  .command('run')
  .option('--owner <owner>', 'only consider given owner code')
  .option('--metric <metric>', 'only consider given metric')
  .action(async (options) => {
    const configuration = await getConfiguration()
    const codeOwners = new Codeowners()
    let files
    if (options.owner) {
      const allOwners = codeOwners.listOwners()
      const owners = options.owner.split(',')
      const unknownOwners = difference(owners, allOwners)
      if (unknownOwners.length > 0)
        panic(`Owners "${unknownOwners}" do not exist, valid owners:\n${allOwners.sort().join('\n')}.`)
      files = await getFiles(owners, codeOwners)
    } else files = await getFiles()

    if (options.metric) {
      if (!configuration.metrics.map((metric) => metric.name).includes(options.metric))
        panic(`Metric ${options.metric} does not exist`)
    }
    const occurrences = await findOccurrences({
      configuration,
      files,
      metric: options.metric,
      progress: newMetricsProgress(),
      codeOwners,
    })
    if (options.owner || options.metric) {
      occurrences.forEach((occurrence) => console.log(`👉 ${occurrence.file_path}:${occurrence.line_number}`))
    } else {
      const table = mapValues(groupBy(occurrences, 'metric_name'), (occurrences) => occurrences.length)
      console.table(table)
    }
  })

program
  .command('push')
  .option('--api-key <api_key>', 'Your cherrypush.com api key')
  .action(async (options) => {
    const configuration = await getConfiguration()
    const apiKey = options.apiKey || process.env.CHERRY_API_KEY
    try {
      await pushOnCurrentCommit(configuration, apiKey)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
    console.log('Your dashboard is available at https://www.cherrypush.com/user/projects')
  })

program
  .command('backfill')
  .option('--api-key <api_key>', 'Your cherrypush.com api key')
  .option('--since <since>', 'yyyy-mm-dd | The date at which the backfill will start (defaults to 1 year ago)')
  .option('--until <until>', 'yyyy-mm-dd | The date at which the backfill will stop (defaults to today)')
  .option('--interval <interval>', 'The number of days between backfills (defaults to 30 days)')
  .action(async (options) => {
    const since = options.since ? new Date(options.since) : substractDays(new Date(), 365)
    const until = options.until ? new Date(options.until) : new Date()
    const interval = options.interval ? parseInt(options.interval) : 30
    if (isNaN(since)) panic('Invalid since date')
    if (isNaN(until)) panic('Invalid until date')
    if (since > until) panic('The since date must be before the until date')
    const initialBranch = await git.branchName()
    if (!initialBranch) panic('Not on a branch, checkout a branch before running the backfill.')
    const hasUncommitedChanges = (await git.uncommittedFiles()).length > 0
    if (hasUncommitedChanges) panic('Please commit your changes before running this command')

    const configuration = await getConfiguration()
    const apiKey = options.apiKey || process.env.CHERRY_API_KEY
    let date = since
    try {
      while (date <= until) {
        console.log(`On day ${toISODate(date)}...`)
        const sha = await git.commitShaAt(date, initialBranch)
        if (!sha) break
        const committedAt = await git.commitDate(sha)
        if (committedAt > until) break

        await git.checkout(sha)
        await pushOnCurrentCommit(configuration, apiKey)
        date = addDays(committedAt, interval)
      }
    } catch (error) {
      console.error(error)
      await git.checkout(initialBranch)
      process.exit(1)
    }

    await git.checkout(initialBranch)
    console.log('Your dashboard is available at https://www.cherrypush.com/user/projects')
  })

const pushOnCurrentCommit = async (configuration, apiKey) => {
  const files = await getFiles()
  const codeOwners = new Codeowners()
  const occurrences = await findOccurrences({ configuration, files, progress: newMetricsProgress(), codeOwners })
  const sha = await git.sha()
  const committedAt = await git.commitDate(sha)
  const metrics = aggregateOccurrences(configuration.metrics, occurrences)
  const lastReportedSha = (await fetchLastReport(apiKey, configuration.project_name))?.commit_sha
  const contributions = lastReportedSha
    ? await findContributions(configuration, codeOwners, lastReportedSha, newContributionsProgress())
    : []
  return upload(apiKey, {
    project_name: configuration.project_name,
    report: { commit_sha: sha, commit_date: committedAt.toISOString(), metrics },
    contributions: contributions.map((contribution) => ({
      author_name: contribution.authorName,
      author_email: contribution.authorEmail,
      commit_sha: contribution.sha,
      commit_date: contribution.date,
      metrics: contribution.metrics,
    })),
  })
}

const formatApiError = async (callback) => {
  try {
    return await callback()
  } catch (error) {
    if (error.response)
      throw new Error(
        `❌ Error while calling cherrypush.com API ${error.response.status}: ${
          error.response.data?.error || error.response.statusText
        }`
      )
    throw error
  }
}

const upload = (apiKey, payload) =>
  formatApiError(async () => {
    console.log(`Uploading stats on commit ${payload.report.commit_sha}`)
    return axios.post(API_BASE_URL + '/push', payload, { params: { api_key: apiKey } }).then(({ data }) => data)
  })

const fetchLastReport = (apiKey, projectName) =>
  formatApiError(() =>
    axios
      .get(API_BASE_URL + '/reports/last', { params: { api_key: apiKey, project_name: projectName } })
      .then(({ data }) => data)
  )

program
  .option('-v, --verbose', 'Enable verbose mode')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().verbose) setVerboseMode(true)
  })
  .parse(process.argv)
