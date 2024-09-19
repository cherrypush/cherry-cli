import { gitProjectRoot, gitRemoteUrl, guessRepositoryInfo } from './git.js'

import { Configuration } from './types.js'
import buildAndImport from './build-and-import.cjs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

export const CONFIG_FILE_LOCAL_PATHS = ['.cherry.js', '.cherry.cjs', '.cherry.ts']
export const WORKFLOW_FILE_LOCAL_PATH = '.github/workflows/cherry_push.yml'

export const CONFIG_FILE_FULL_PATHS = CONFIG_FILE_LOCAL_PATHS.map((filePath) => `${process.cwd()}/${filePath}`)
export const WORKFLOW_FILE_FULL_PATH = `${process.cwd()}/${WORKFLOW_FILE_LOCAL_PATH}`

const CONFIG_TEMPLATE_PATH = dirname(fileURLToPath(import.meta.url)) + '/templates/.cherry.js.template'
const WORKFLOW_TEMPLATE_PATH = dirname(fileURLToPath(import.meta.url)) + '/templates/.cherry_push.yml.template'

export const createConfigurationFile = (projectName: string) =>
  fs.writeFileSync(
    CONFIG_FILE_FULL_PATHS[0],
    fs.readFileSync(CONFIG_TEMPLATE_PATH).toString().replace('PROJECT_NAME', projectName)
  )

export const createWorkflowFile = () => {
  fs.mkdirSync(`${process.cwd()}/.github/workflows`, { recursive: true })
  fs.writeFileSync(WORKFLOW_FILE_FULL_PATH, fs.readFileSync(WORKFLOW_TEMPLATE_PATH).toString())
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
