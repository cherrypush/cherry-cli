#! /usr/bin/env node

import * as git from '../../src/git.js'

import {
  createConfigurationFile,
  createWorkflowFile,
  getConfigurationFile,
  workflowExists,
} from '../../src/configuration.js'

import prompt from 'prompt'

export default function (program) {
  program.command('init').action(async () => {
    // If the configuration file already exists, don't allow the user to run the init command
    const configurationFile = getConfigurationFile()
    if (configurationFile) {
      console.error(`${configurationFile} already exists.`)
      process.exit(1)
    }

    prompt.message = ''
    prompt.start()

    const remoteUrl = await git.getRemoteUrl()
    let projectName = git.guessProjectName(remoteUrl)
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
