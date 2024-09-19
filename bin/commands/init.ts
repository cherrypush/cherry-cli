#! /usr/bin/env node

import * as git from '../../src/git.js'

import { createConfigurationFile, createWorkflowFile, getConfigFile, workflowExists } from '../../src/configuration.js'

import prompt from 'prompt'

export default function (program) {
  program.command('init').action(async () => {
    // If the configuration file already exists, don't allow the user to run the init command
    const configurationFile = getConfigFile()
    if (configurationFile) {
      console.error(`${configurationFile} already exists.`)
      process.exit(1)
    }

    prompt.message = ''
    prompt.start()

    const remoteUrl = await git.gitRemoteUrl()
    let projectName = git.guessProjectName(remoteUrl)

    if (projectName === null) {
      const { repo } = await prompt.get({
        properties: { repo: { message: 'Enter your project name', required: true } },
      })
      projectName = repo
    }
    createConfigurationFile(projectName)

    if (!workflowExists()) createWorkflowFile()
    console.log('Your initial setup is done! Now try the command `cherry run` to see your first metrics.')
  })
}
