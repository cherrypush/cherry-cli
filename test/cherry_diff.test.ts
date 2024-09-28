import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execAsync, expectError } from './helpers.js'

import fs from 'fs'
import path from 'path'

const OCCURRENCES_FILE_PATH = 'occurrences.json'
const OCCURRENCES_FILE_CONTENT = [
  {
    name: 'JS circular dependencies',
    occurrences: [
      {
        text: 'configuration.ts > git.ts',
        url: 'https://github.com/cherrypush/cherry-cli/blob/HEAD/configuration.ts',
        owners: [],
      },
    ],
  },
]

const CHERRY_BIN_PATH = 'tsx ./../../../bin/cherry.ts'

const originalCwd = process.cwd()
const fakeProjectPath = path.join(originalCwd, 'test/fixtures/super-project-source')

describe('cherry diff', () => {
  beforeAll(() => {
    process.chdir(fakeProjectPath)
  })

  afterAll(() => {
    if (fs.existsSync(OCCURRENCES_FILE_PATH)) fs.unlinkSync(OCCURRENCES_FILE_PATH)
    process.chdir(originalCwd)
  })

  it('should exit with an error if --metric is missing', async () => {
    const error = await expectError(`${CHERRY_BIN_PATH} diff --quiet`)
    // @ts-expect-error - TODO: properly type error
    expect(error.stderr).toContain(`required option '--metric <metric>' not specified`)
  })

  it('can take multiple metrics', async () => {
    const { stdout } = await execAsync(`${CHERRY_BIN_PATH} diff --quiet --metric TODO --metric "[loc] JavaScript"`)
    expect(stdout).toContain('Metric: TODO')
    expect(stdout).toContain('Metric: [loc] JavaScript')
  })

  it('requires to commit changes before running cherry diff', async () => {
    fs.writeFileSync(OCCURRENCES_FILE_PATH, 'unexpected content')
    const error = await expectError(`${CHERRY_BIN_PATH} diff --quiet --metric TODO`)
    // @ts-expect-error - TODO: properly type error
    expect(error.stderr).toContain('Please commit your changes before running cherry diff')
  })

  it('does not require to commit changes when --input-file is provided', async () => {
    fs.writeFileSync(OCCURRENCES_FILE_PATH, JSON.stringify(OCCURRENCES_FILE_CONTENT))
    const { stdout } = await execAsync(
      `${CHERRY_BIN_PATH} diff --quiet --metric TODO --input-file ${OCCURRENCES_FILE_PATH}`
    )
    expect(stdout).toContain('Metric: TODO')
    expect(stdout).toContain('Current value: 1')
  })
})
