import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { execAsync } from './helpers'
import fs from 'fs'
import path from 'path'

const originalCwd = process.cwd()
const fixturesPath = path.join(originalCwd, 'test/fixtures/project-one')

describe('cherry init', () => {
  beforeAll(() => process.chdir(fixturesPath))
  afterAll(() => process.chdir(originalCwd))

  it('creates a config file', async () => {
    // Remove .cherry.js file if it exists
    if (fs.existsSync('.cherry.js')) fs.unlinkSync('.cherry.js')

    // The cherry init command prompts for a project name. Feed it with: "cherrypush/cherry-cli"
    await execAsync('echo "cherrypush/cherry-cli" | tsx ./../../../bin/cherry.js init')
    expect(fs.existsSync('.cherry.js')).toBe(true)

    const cherryConfig = await import(path.join(process.cwd(), '.cherry.js'))
    expect(cherryConfig.project_name).toBe('cherrypush/cherry-cli')

    // Remove .cherry.js file
    if (fs.existsSync('.cherry.js')) fs.unlinkSync('.cherry.js')
    // Remove .github folder
    if (fs.existsSync('.github')) fs.rmdirSync('.github', { recursive: true })
  })
})
