#! /usr/bin/env node

import fs from 'fs'
import axios from 'axios'
import { program } from 'commander'
import { findOccurrences } from '../src/occurrences.js'
import { configurationExists, getConfiguration, createConfigurationFile } from '../src/configuration.js'
import prompt from 'prompt'
import { guessRepoName } from '../src/git.js'

const API_BASE_URL = 'https://www.cherrypush.com/api'

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

program.command('run')
  .option('-o, --outputfile [outputfile]', 'Specify output file')
  .action(async (options) => {
    const configuration = await getConfiguration()
    const occurrences = findOccurrences(configuration, options.outputfile)
    if (options.outputfile) {
      fs.writeFileSync(options.outputfile, JSON.stringify(occurrences))
      console.log(`Output saved to ${options.outputfile}`)
    } else {
      console.log(occurrences)
    }
    console.log(`There are ${occurrences.length} occurrences ready to be reported.`)
    console.log('Run `cherry push` to push them to your public dashboard.')
  })

program.command('push').action(async () => {
  const configuration = await getConfiguration()
  const occurrences = findOccurrences(configuration)
  console.log(`Uploading ${occurrences.length} occurrences...`)
  axios
    .post(API_BASE_URL + '/occurrences', { occurrences: JSON.stringify(occurrences) })
    .then(({ data }) => console.log('Response:', data))
    .catch((error) => console.error(error.message))
})

program.parse(process.argv)
