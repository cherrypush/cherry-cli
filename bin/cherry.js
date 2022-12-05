#! /usr/bin/env node

import fs from 'fs'
import axios from 'axios'
import { program } from 'commander'
import { findOccurrences } from '../src/occurrences.js'
import { configurationExists, getConfiguration, createConfigurationFile } from '../src/configuration.js'
import prompt from 'prompt'
import { guessRepoName } from '../src/git.js'

const API_BASE_URL = process.env.API_URL ?? 'https://www.cherrypush.com/api'

export const JSON_EXPORT_PATH = 'cherry.json'

program.command('init').action(async () => {
  if (configurationExists()) {
    console.error('.cherry.js already exists, run `cherry run` instead')
    process.exit(0)
  }

  prompt.message = ''
  prompt.start()
  const { repo } = await prompt.get({
    properties: { repo: { message: 'Enter the path to your repo', default: guessRepoName(), required: true } },
  })
  createConfigurationFile(repo)
  console.log('.cherry.js file successfully created! You can now run `cherry run` to test it')
})

program
  .command('run')
  .option('--json', 'exports occurrences into a json file')
  .action(async (options) => {
    const configuration = await getConfiguration()
    const occurrences = findOccurrences(configuration)
    if (options.json) {
      fs.writeFileSync(JSON_EXPORT_PATH, JSON.stringify(occurrences, null, 2))
      console.log(`${occurrences.length} occurrences saved to: ${process.cwd() + '/' + JSON_EXPORT_PATH}`)
    } else {
      console.log(occurrences)
      console.log(`${occurrences.length} occurrences ready to be reported.`)
    }
    console.log('Run `cherry push` to push them to your public dashboard.')
  })

program
  .command('push')
  .option('--api-key <api_key>')
  .action(async (options) => {
    const configuration = await getConfiguration()
    const apiKey = options.apiKey || configuration.api_key
    const occurrences = findOccurrences(configuration)
    console.log(`Uploading ${occurrences.length} occurrences...`)
    axios
      .post(
        API_BASE_URL + '/occurrences',
        { occurrences: JSON.stringify(occurrences) },
        { params: { api_key: apiKey } }
      )
      .then(({ data }) => {
        console.log('Response:', data)
        console.log(`Your dashboard is available at ${API_BASE_URL}`)
      })
      .catch((error) =>
        console.error(`Error ${error.response.status}: ${error.response.data.error || error.response.statusText}`)
      )
  })

program.parse(process.argv)
