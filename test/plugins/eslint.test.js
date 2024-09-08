import { describe, expect, it } from 'vitest'

import { execAsync } from '../helpers'

// Purposefully introduce some eslint errors to test the eslint plugin
// TODO: It'd be better if we used a fake repo from the fixtures folder

// eslint-disable-next-line no-unused-vars
function testEslint() {
  // eslint-disable-next-line no-unused-vars
  var unusedVar = 42
  console.log('ESLint test')
  let obj = { key: 'value' }
  return obj
}

describe('eslint plugin', () => {
  it('returns paths relative to the root of the project', async () => {
    const { stdout } = await execAsync('node bin/cherry.js run --metric "[eslint] no-unused-vars"')
    expect(stdout).toContain('👉 test/plugins/eslint.test.js:9')
  })
})
