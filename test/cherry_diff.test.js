import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execAsync, expectError } from './helpers.js'

import fs from 'fs'
import path from 'path'

const TEMPORARY_FILE_PATH = 'test_temporary_file'

const CHERRY_BIN_PATH = 'node ./../../../bin/cherry.js'

const originalCwd = process.cwd()
const fakeProjectPath = path.join(originalCwd, 'test/fixtures/project-one')

describe('cherry diff', () => {
  beforeAll(() => {
    process.chdir(fakeProjectPath)
    if (fs.existsSync(TEMPORARY_FILE_PATH)) fs.unlinkSync(TEMPORARY_FILE_PATH)
  })

  afterAll(() => process.chdir(originalCwd))

  it('uses the default configuration', async () => {
    const { stdout } = await execAsync(`${CHERRY_BIN_PATH} diff --quiet --metric "[loc] JavaScript"`)
    expect(stdout).toContain('No .cherry.js file found, using default configuration...')
  })

  it('should exit with an error if --metric is missing', async () => {
    const error = await expectError(`${CHERRY_BIN_PATH} diff --quiet`)
    expect(error.stderr).toContain(`required option '--metric <metric>' not specified`)
  })

  it('can take multiple metrics', async () => {
    const { stdout } = await execAsync(`${CHERRY_BIN_PATH} diff --quiet --metric TODO --metric "[loc] JavaScript"`)
    expect(stdout).toContain('Metric: TODO')
    expect(stdout).toContain('Metric: [loc] JavaScript')
  })

  it('requires to commit changes before running cherry diff', async () => {
    fs.writeFileSync(TEMPORARY_FILE_PATH, 'unexpected content')
    const error = await expectError(`${CHERRY_BIN_PATH} diff --quiet --metric TODO`)
    expect(error.stderr).toContain('Please commit your changes before running cherry diff')
  })

  it('does not require to commit changes when --input-file is provided', async () => {
    const error = await expectError(`${CHERRY_BIN_PATH} diff --quiet --metric TODO --input-file ${TEMPORARY_FILE_PATH}`)
    expect(error.code).toBe(1)
    expect(error.stderr).not.toContain('Please commit your changes before running cherry diff')
  })
})
