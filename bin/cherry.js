#! /usr/bin/env node

import fs from 'fs'
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
import { addDays, toISODate } from '../src/date.js'
import { panic } from '../src/error.js'
import { findContributions } from '../src/contributions.js'
import { getFiles } from '../src/files.js'
import { newProgress } from '../src/progress.js'
import Codeowners from '../src/codeowners.js'
import difference from 'lodash/difference.js'

dotenv.config()

const API_BASE_URL = process.env.API_URL ?? 'https://www.cherrypush.com/api'

export const JSON_EXPORT_PATH = 'cherry.json'

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
  .option('--json', 'exports occurrences into a json file')
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
      progress: newProgress(),
      codeOwners,
    })
    if (options.json) {
      fs.writeFileSync(JSON_EXPORT_PATH, JSON.stringify(occurrences, null, 2))
      console.log(`${occurrences.length} occurrences saved to: ${process.cwd() + '/' + JSON_EXPORT_PATH}`)
    } else {
      if (options.owner || options.metric) {
        occurrences.forEach((occurrence) => console.log(`👉 ${occurrence.file_path}:${occurrence.line_number}`))
      } else {
        const table = mapValues(groupBy(occurrences, 'metric_name'), (occurrences) => occurrences.length)
        console.table(table)
      }
    }
  })

program
  .command('push')
  .option('--api-key <api_key>', 'Your cherrypush.com api key')
  .action(async (options) => {
    const configuration = await getConfiguration()
    const apiKey = options.apiKey || process.env.CHERRY_API_KEY
    const files = await getFiles()
    const codeOwners = new Codeowners()
    console.log(`Computing metrics values...`)
    const occurrences = await findOccurrences({
      configuration,
      files,
      progress: newProgress(),
      codeOwners,
    })
    const sha = await git.sha()
    const committedAt = await git.commitDate(sha)
    const metrics = aggregateOccurrences(configuration.metrics, occurrences)
    const lastReportedSha = (await fetchLastReport(apiKey, configuration.project_name))?.commit_sha
    console.log(`Computing contributions...`)
    ;(await git.log()).forEach((line) => console.log(line))
    const contributions = lastReportedSha ? await findContributions(configuration, codeOwners, lastReportedSha) : []
    console.log(`Uploading metrics values...`)
    try {
      await upload(apiKey, {
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
    } catch (error) {
      process.exit(1)
    }
    console.log('Your dashboard is available at https://www.cherrypush.com/user/projects')
  })

program
  .command('backfill')
  .option('--api-key <api_key>', 'Your cherrypush.com api key')
  .requiredOption('--since <since>', 'yyyy-mm-dd | The date at which the backfill will start')
  .option('--until <until>', 'yyyy-mm-dd | The date at which the backfill will stop (defaults to today)')
  .option('--interval <interval>', 'The number of days between backfills (defaults to 1)')
  .action(async (options) => {
    const since = new Date(options.since)
    const until = options.until ? new Date(options.until) : new Date()
    const interval = options.interval ? parseInt(options.interval) : 1
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
    while (date <= until) {
      console.log(`Backfilling day ${toISODate(date)}...`)
      const sha = await git.commitShaAt(date, initialBranch)
      if (!sha) break

      const committedAt = await git.commitDate(sha)
      await git.checkout(sha)
      const codeOwners = new Codeowners()
      try {
        const files = await getFiles()
        const occurrences = await findOccurrences({
          configuration,
          files,
          progress: newProgress(),
          codeOwners,
        })
        const lastReportedSha = (await fetchLastReport(apiKey, configuration.project_name))?.commit_sha
        const metrics = aggregateOccurrences(configuration.metrics, occurrences)
        const contributions = lastReportedSha ? await findContributions(configuration, codeOwners, lastReportedSha) : []
        await upload(apiKey, {
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
      } catch (error) {
        console.error(error)
        await git.checkout(initialBranch)
        process.exit(1)
      }
      date = addDays(committedAt, interval)
    }
    await git.checkout(initialBranch)

    console.log('Backfill done')
    console.log('Your dashboard is available at https://www.cherrypush.com/user/projects')
  })

const upload = (apiKey, payload) =>
  axios
    .post(API_BASE_URL + '/push', payload, { params: { api_key: apiKey } })
    .then(({ data }) => data)
    .catch((error) => {
      console.error(
        `❌ Error while calling cherrypush.com API ${error.response.status}: ${
          error.response.data.error || error.response.statusText
        }`
      )
      throw error
    })

const fetchLastReport = (apiKey, projectName) =>
  axios
    .get(API_BASE_URL + '/reports/last', { params: { api_key: apiKey, project_name: projectName } })
    .then(({ data }) => data)
    .catch((error) => {
      console.error(
        `❌ Error while calling cherrypush.com API ${error.response.status}: ${
          error.response.data.error || error.response.statusText
        }`
      )
      throw error
    })

program.parse(process.argv)
