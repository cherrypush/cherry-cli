import { describe, expect, test } from 'vitest'

import Codeowners from './codeowners.js'

describe('getOwners', () => {
  test('/src/ pattern matches files inside src folder', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('src/codeowners.test.ts')).toEqual(['@source'])
  })

  test('plugins/ pattern should match any folder named plugins', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('src/plugins/loc.js')).toEqual(['@plugins'])
  })

  test('defaults to the root owner', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('bin/commands/push.ts')).toEqual(['@root'])
  })

  test('*.test.ts also matches files from subfolders', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('test/cherry_diff.test.ts')).toEqual(['@test'])
  })

  test('non existing files return an empty list of owners', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('bin/non-existing-file')).toEqual([])
  })

  test('/src/plugins/eslint.ts pattern should override previous ones', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('src/plugins/eslint.js')).toEqual(['@eslint-plugin'])
  })
})
