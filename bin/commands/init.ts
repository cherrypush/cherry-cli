#! /usr/bin/env node

import { createConfigurationFile, createWorkflowFile, getConfigFile, workflowExists } from '../../src/configuration.js'

import { Command } from 'commander'
import { gitProjectRoot, gitRemoteUrl } from '../../src/git.js'
import { guessRepositoryInfo } from '../../src/repository.js'

export default function (program: Command) {
  program.command('init').action(async () => {
    // If the configuration file already exists, don't allow the user to run the init command
    const configurationFile = getConfigFile()
    if (configurationFile) {
      console.error(`${configurationFile} already exists.`)
      process.exit(1)
    }

    const remoteUrl = await gitRemoteUrl()
    const projectRoot = await gitProjectRoot()
    const repositoryInfo = await guessRepositoryInfo({ remoteUrl, configFile: null, projectRoot })

    if (!repositoryInfo.host || !repositoryInfo.owner || !repositoryInfo.name)
      throw new Error('Could not guess repository info. Please setup your config file manually.')

    console.log(`Creating configuration file for ${repositoryInfo.owner}/${repositoryInfo.name}...`)
    createConfigurationFile(repositoryInfo)

    if (!workflowExists()) createWorkflowFile()
    console.log('Your initial setup is done! Now try the command `cherry run` to see your first metrics.')
  })
}
