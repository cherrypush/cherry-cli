#! /usr/bin/env node

import fs from 'fs'
import axios from 'axios'
import { program } from 'commander'
import { findOccurrences } from '../src/occurrences.js'
import { configurationExists, getConfiguration, createConfigurationFile } from '../src/configuration.js'
import prompt from 'prompt'
import { guessRepoName } from '../src/git.js'
import groupBy from 'lodash/groupBy.js'
import mapValues from 'lodash/mapValues.js'
import * as git from '../src/git.js'
import { substractDays, toISODate } from '../src/date.js'
import { panic } from '../src/error.js'

const API_BASE_URL = process.env.API_URL ?? 'https://www.cherrypush.com/api'

export const JSON_EXPORT_PATH = 'cherry.json'

program.command('init').action(async () => {
  if (configurationExists()) {
    console.error('.cherry.js already exists, run `cherry run` instead')
    process.exit(0)
  }

  prompt.message = ''
  prompt.start()
  const defaultRepoName = await guessRepoName()
  const { repo } = await prompt.get({
    properties: { repo: { message: 'Enter the path to your repo', default: defaultRepoName, required: true } },
  })
  createConfigurationFile(repo)
  console.log('.cherry.js file successfully created! You can now run `cherry run` to test it')
})

program
  .command('run')
  .option('--json', 'exports occurrences into a json file')
  .action(async (options) => {
    const configuration = await getConfiguration()
    const occurrences = await findOccurrences(configuration)
    if (options.json) {
      fs.writeFileSync(JSON_EXPORT_PATH, JSON.stringify(occurrences, null, 2))
      console.log(`${occurrences.length} occurrences saved to: ${process.cwd() + '/' + JSON_EXPORT_PATH}`)
    } else {
      const table = mapValues(groupBy(occurrences, 'metric_name'), (occurrences) => occurrences.length)
      console.table(table)
      console.log(`${occurrences.length} occurrences ready to be reported.`)
    }
    console.log('Run `cherry push` to push them to your dashboard.')
  })

program
  .command('push')
  .requiredOption('--api-key <api_key>', 'Your cherrypush.com api key')
  .action(async (options) => {
    const configuration = await getConfiguration()
    const apiKey = options.apiKey || configuration.api_key
    const occurrences = await findOccurrences(configuration)
    const sha = await git.sha()
    const committedAt = await git.commitDate(sha)
    console.log(`Uploading ${occurrences.length} occurrences...`)
    const data = await uploadReport(apiKey, {
      commit_sha: sha,
      commit_date: committedAt.toISOString(),
      project_name: configuration.project_name,
      occurrences: JSON.stringify(occurrences),
    })
    console.log('Response:', data)
    console.log('Your dashboard is available at https://www.cherrypush.com/user/projects')
  })

program
  .command('backfill')
  .requiredOption('--api-key <api_key>', 'Your cherrypush.com api key')
  .requiredOption('--since <since>', 'yyyy-mm-dd | The date at which the backfill will start')
  .option('--until <until>', 'yyyy-mm-dd | The date at which the backfill will stop (defaults to today)')
  .action(async (options) => {
    const since = new Date(options.since)
    const until = options.until ? new Date(options.until) : substractDays(new Date(), 1)
    if (isNaN(since)) panic('Invalid since date')
    if (isNaN(until)) panic('Invalid until date')
    if (since > until) panic('The since date must be before the until date')
    const initialBranch = await git.branchName()
    if (!initialBranch) panic('Not on a branch, checkout a branch before running the backfill.')

    try {
      const configuration = await getConfiguration()
      const apiKey = options.apiKey || configuration.api_key
      let date = until
      while (date >= since) {
        console.log(`Backfilling day ${toISODate(date)}...`)
        const sha = await git.commitShaAt(date)
        if (!sha) break

        const committedAt = await git.commitDate(sha)
        await git.checkout(sha)
        const occurrences = await findOccurrences(configuration)
        await uploadReport(apiKey, {
          commit_sha: sha,
          commit_date: committedAt.toISOString(),
          project_name: configuration.project_name,
          occurrences: JSON.stringify(occurrences),
        })
        date = substractDays(committedAt, 1)
      }
    } finally {
      await git.checkout(initialBranch)
    }
    console.log('Backfill done')
    console.log('Your dashboard is available at https://www.cherrypush.com/user/projects')
  })

const uploadReport = (apiKey, report) =>
  axios
    .post(API_BASE_URL + '/reports', report, { params: { api_key: apiKey } })
    .then(({ data }) => data)
    .catch((error) =>
      panic(
        `Error while calling cherrypush.com API ${error.response.status}: ${
          error.response.data.error || error.response.statusText
        }`
      )
    )

program.parse(process.argv)
