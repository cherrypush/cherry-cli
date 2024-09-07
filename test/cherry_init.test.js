import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const originalCwd = process.cwd()
const fixturesPath = path.join(originalCwd, 'test/fixtures/project-one')

const execAsync = promisify(exec)

describe('cherry init', () => {
  beforeAll(() => process.chdir(fixturesPath))
  afterAll(() => process.chdir(originalCwd))

  it('creates a config file', async () => {
    // Remove .cherry.js file if it exists
    if (fs.existsSync('.cherry.js')) fs.unlinkSync('.cherry.js')

    // Specify the project name to "cherrypush/cherry-cli"
    await execAsync('echo "cherrypush/cherry-cli" | node ./../../../bin/cherry.js init')
    expect(fs.existsSync('.cherry.js')).toBe(true)

    const cherryConfig = await import(path.join(process.cwd(), '.cherry.js'))
    expect(cherryConfig.project_name).toBe('cherrypush/cherry-cli')

    // Remove .cherry.js file
    if (fs.existsSync('.cherry.js')) fs.unlinkSync('.cherry.js')
    // Remove .github folder
    if (fs.existsSync('.github')) fs.rmdirSync('.github', { recursive: true })
  })
})
