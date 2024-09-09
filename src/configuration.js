import { getRemoteUrl, guessProjectName } from './git.js'

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

/**
 * Creates a configuration file for the project.
 *
 * This function reads a template configuration file, replaces the placeholder
 * 'PROJECT_NAME' with the provided project name, and writes the result to the
 * configuration file path.
 *
 * @param {string} projectName - The name of the project to insert into the configuration file.
 * @returns {void}
 */
export const createConfigurationFile = (projectName) =>
  fs.writeFileSync(
    CONFIG_FILE_FULL_PATHS[0],
    fs.readFileSync(CONFIG_TEMPLATE_PATH).toString().replace('PROJECT_NAME', projectName)
  )

export const createWorkflowFile = () => {
  fs.mkdirSync(`${process.cwd()}/.github/workflows`, { recursive: true })
  fs.writeFileSync(WORKFLOW_FILE_FULL_PATH, fs.readFileSync(WORKFLOW_TEMPLATE_PATH).toString())
}

export const getConfigurationFile = () => CONFIG_FILE_FULL_PATHS.find((filePath) => fs.existsSync(filePath))
export const workflowExists = () => fs.existsSync(WORKFLOW_FILE_FULL_PATH)

/**
 * Retrieves the configuration for the project.
 * If no configuration file is found, it uses a default configuration.
 *
 * @returns {Promise<{ project_name: string }>} The configuration object.
 */
export const getConfiguration = async () => {
  const configurationFile = getConfigurationFile()
  if (!configurationFile) {
    const remoteUrl = await getRemoteUrl()
    const guessedProjectName = guessProjectName(remoteUrl)
    console.log('ℹ️  No .cherry.js file found, using default configuration...')
    return { project_name: guessedProjectName, plugins: { loc: {} }, metrics: [] }
  }

  const imported = buildAndImport(configurationFile)

  // Allow both syntaxes on configuration files:
  // - module.exports = ...
  // - export default ...   => will be wrapped in a { default } after being processed by buildAndImport
  return imported.default ?? imported
}
