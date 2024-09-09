import { describe, expect, it } from 'vitest'

import { execAsync } from '../helpers'

// Purposefully introduce some eslint errors to test the eslint plugin
// TODO: It'd be better if we used a fake repo from the fixtures folder

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testEslint() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  var unusedVar = 42
  console.log('ESLint test')
  let obj = { key: 'value' }
  return obj
}

describe('eslint plugin', () => {
  it('works', async () => {
    const { stdout } = await execAsync('tsx ./bin/cherry.ts run --metric "[eslint] no-unused-vars"')

    // Uses the relative path to the project root, containing the line number
    expect(stdout).toContain('👉 test/plugins/eslint.test.js:9')

    // Builds the correct permalink, also containing the line number
    expect(stdout).toContain('https://github.com/cherrypush/cherry-cli/blob/HEAD/test/plugins/eslint.test.js#L9')
  })
})
