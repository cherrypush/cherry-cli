import { describe, expect, it } from 'vitest'

import { execAsync } from '../helpers'

describe('eslint plugin', () => {
  it('works', async () => {
    const { stdout } = await execAsync('npm run cherry -- run --metric "[eslint] @typescript-eslint/no-unused-vars"')

    // Uses the relative path to the project root, containing the line number
    expect(stdout).toContain('👉 test/fixtures/super-project/main.js:2')

    // Builds the correct permalink, also containing the line number
    expect(stdout).toContain(
      'https://github.com/cherrypush/cherry-cli/blob/HEAD/test/fixtures/super-project/main.js#L2'
    )
  })
})
