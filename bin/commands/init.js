#! /usr/bin/env node

import prompt from 'prompt'
import {
  createConfigurationFile,
  createWorkflowFile,
  getConfigurationFile,
  workflowExists,
} from '../../src/configuration.js'
import * as git from '../../src/git.js'

export default function (program) {
  program.command('init').action(async () => {
    const configurationFile = getConfigurationFile()
    if (configurationFile) {
      console.error(`${configurationFile} already exists.`)
      process.exit(1)
    }

    prompt.message = ''
    prompt.start()

    let projectName = await git.guessProjectName()
    if (!projectName) {
      projectName = await prompt.get({
        properties: {
          repo: { message: 'Enter your project name', required: true },
        },
      }).repo
    }
    createConfigurationFile(projectName)

    if (!workflowExists()) createWorkflowFile()
    console.log('Your initial setup is done! Now try the command `cherry run` to see your first metrics.')
  })
}
