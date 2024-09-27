import { describe, expect, test } from 'vitest'

import Codeowners from './codeowners.js'

describe('getOwners', () => {
  test('/src/ pattern matches files inside src folder', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('src/codeowners.test.ts')).toEqual(['@fwuensche', '@rchoquet'])
  })

  test('plugins/ pattern should match any folder named plugins', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('src/plugins/eslint.js')).toEqual(['@fwuensche'])
  })

  test('defaults to the root owner', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('bin/commands/push.ts')).toEqual(['@fwuensche'])
  })

  test('*.js also matches files from subfolders', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('bin/commands/diff.js')).toEqual(['@rchoquet'])
  })

  test('non existing files return an empty list of owners', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('bin/non-existing-file')).toEqual([])
  })
})
