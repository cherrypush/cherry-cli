import fs from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

export const JSON_EXPORT_PATH = 'cherry.json'
export const CONFIG_FILE_PATH = `${process.cwd()}/.cherry.js`
const TEMPLATE_PATH = dirname(fileURLToPath(import.meta.url)) + '/../.cherry.js.template'

export const createConfigurationFile = (projectName) =>
  fs.writeFileSync(CONFIG_FILE_PATH, fs.readFileSync(TEMPLATE_PATH).toString().replace('PROJECT_NAME', projectName))

export const configurationExists = () => fs.existsSync(CONFIG_FILE_PATH)

export const getConfiguration = async () => {
  if (!configurationExists()) {
    console.error('No .cherry.js file found in the current directory, run "cherry init" to create one')
    process.exit(1)
  }

  return (await import(CONFIG_FILE_PATH)).default
}
