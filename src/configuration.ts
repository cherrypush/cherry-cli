import { gitProjectRoot, gitRemoteUrl } from './git.js'

import fs from 'fs'
import buildAndImport from './build-and-import.cjs'
import { guessRepositoryInfo } from './repository.js'
import { Configuration, Repository } from './types.js'

export const CONFIG_FILE_LOCAL_PATHS = ['.cherry.js', '.cherry.cjs', '.cherry.ts']
export const WORKFLOW_FILE_LOCAL_PATH = '.github/workflows/cherry_push.yml'

export const CONFIG_FILE_FULL_PATHS = CONFIG_FILE_LOCAL_PATHS.map((filePath) => `${process.cwd()}/${filePath}`)
export const WORKFLOW_FILE_FULL_PATH = `${process.cwd()}/${WORKFLOW_FILE_LOCAL_PATH}`

const CONFIG_TEMPLATE = `// For detailed configuration options, see the documentation:
// https://www.cherrypush.com/docs
//
// In this configuration file, you can set up your repository information,
// enable plugins, and build custom metrics for your codebase.

export default {
  repository: {
    host: '{{HOST}}',
    owner: '{{OWNER}}',
    name: '{{NAME}}',
    subdir: '{{SUBDIR}}',
  },
  plugins: { loc: {} },
  metrics: [
    {
      name: 'TODO/FIXME',
      pattern: /(TODO|FIXME):/i, // the i flag makes the regex case insensitive
    },
  ],
}`

const WORKFLOW_TEMPLATE = `name: cherry push

on:
  push:
    branches:
      - \${{ github.event.repository.default_branch }}

jobs:
  cherry_push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout project
        uses: actions/checkout@v4

      - name: Install dependencies
        run: npm i -g cherrypush

      - name: Push metrics to Cherry
        run: cherry push --quiet --api-key=\${{ secrets.CHERRY_API_KEY }}`

export const createConfigurationFile = (repositoryInfo: Repository) => {
  const filePath = CONFIG_FILE_FULL_PATHS[0]
  console.log('Creating configuration file at:', filePath)

  fs.writeFileSync(
    filePath,
    CONFIG_TEMPLATE.replace('{{NAME}}', repositoryInfo.name)
      .replace('{{OWNER}}', repositoryInfo.owner)
      .replace('{{HOST}}', repositoryInfo.host)
      .replace('{{SUBDIR}}', repositoryInfo.subdir)
  )
}

export const createWorkflowFile = () => {
  fs.mkdirSync(`${process.cwd()}/.github/workflows`, { recursive: true })
  fs.writeFileSync(WORKFLOW_FILE_FULL_PATH, WORKFLOW_TEMPLATE)
}

export const getConfigFile = () => CONFIG_FILE_FULL_PATHS.find((filePath) => fs.existsSync(filePath)) ?? null

export const workflowExists = () => fs.existsSync(WORKFLOW_FILE_FULL_PATH)

export const getConfiguration = async (): Promise<Configuration> => {
  const configFile = getConfigFile()
  const remoteUrl = await gitRemoteUrl()
  const projectRoot = await gitProjectRoot()

  // Require the user to set up Cherry before running any command
  if (!configFile) throw new Error('Please set up Cherry using the command: cherry init')

  const imported = buildAndImport(configFile)
  // Allow both syntaxes on configuration files:
  // - module.exports = ...
  // - export default ...   => will be wrapped in a { default } after being processed by buildAndImport
  const config = imported.default ?? imported

  return {
    ...config,
    // If the repository is not provided in the configuration file, try to guess it
    repository: config.repository ?? (await guessRepositoryInfo({ remoteUrl, configFile, projectRoot })),
  }
}
