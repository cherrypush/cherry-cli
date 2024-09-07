import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

const TEMPORARY_FILE_PATH = 'test_temporary_file'

const CHERRY_BIN_PATH = 'node ./../../../bin/cherry.js'

const originalCwd = process.cwd()
const fixturesPath = path.join(originalCwd, 'test/fixtures/project-one')

describe('cherry diff', () => {
  beforeAll(() => {
    if (fs.existsSync(TEMPORARY_FILE_PATH)) fs.unlinkSync(TEMPORARY_FILE_PATH)
    process.chdir(fixturesPath)
  })
  afterAll(() => process.chdir(originalCwd))

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
      expect(error.stderr).toContain('Please commit your changes before running cherry diff')
    }
  })

  it('does not require to commit changes when --input-file is provided', async () => {
    try {
      await execAsync(`${CHERRY_BIN_PATH} diff --quiet --metric TODO --input-file ${TEMPORARY_FILE_PATH}`)
    } catch (error) {
      expect(error.code).toBe(1)
      expect(error.stderr).not.toContain('Please commit your changes before running cherry diff')
    }
  })
})
