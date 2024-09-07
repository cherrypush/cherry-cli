import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

const TEMPORARY_FILE_PATH = 'test_temporary_file'

const CHERRY_BIN_PATH = 'node ./../../../bin/cherry.js'

const originalCwd = process.cwd()
const fixturesPath = path.join(originalCwd, 'test/fixtures/project-one')

beforeEach(() => {
  if (fs.existsSync(TEMPORARY_FILE_PATH)) {
    fs.unlinkSync(TEMPORARY_FILE_PATH)
  }
})

// TODO: Cherry diff tests fail when launched before commiting changes. We should probably create a fixture repo to test this properly.
describe('cherry diff', () => {
  beforeAll(() => process.chdir(fixturesPath)) // Change to `test/fixtures/project-one`
  afterAll(() => process.chdir(originalCwd)) // Change back to the original working directory

  it('should exit with an error if --metric is missing', async () => {
    try {
      await execAsync(`${CHERRY_BIN_PATH} diff --quiet`)
    } catch (error) {
      expect(error.code).toBe(1)
      expect(error.stderr).toContain(`required option '--metric <metric>' not specified`)
    }
  })

  it('can take multiple metrics', async () => {
    const { stdout } = await execAsync(`${CHERRY_BIN_PATH} diff --quiet --metric TODO --metric "[loc] JavaScript"`)
    expect(stdout).toContain('Metric: TODO')
    expect(stdout).toContain('Metric: [loc] JavaScript')
  })

  it('requires to commit changes before running cherry diff', async () => {
    fs.writeFileSync(TEMPORARY_FILE_PATH, 'unexpected content')

    try {
      await execAsync(`${CHERRY_BIN_PATH} diff --quiet --metric TODO`)
    } catch (error) {
      expect(error.code).toBe(1)
      expect(error.stderr).toContain('Please commit your changes before running cherry diff.')
    }
  })

  it('does not require to commit changes when --input-file is provided', async () => {
    try {
      await execAsync(`${CHERRY_BIN_PATH} diff --quiet --metric TODO --input-file ${TEMPORARY_FILE_PATH}`)
    } catch (error) {
      expect(error.code).toBe(1)
      expect(error.stderr).not.toContain('Please commit your changes before running cherry diff.')
    }
  })
})
