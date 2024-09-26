import { describe, expect, it } from 'vitest'

import Codeowners from './codeowners.js'

describe('getOwners', () => {
  // Assuming src folder is owned by @fwuensche and @rchoquet
  it('recognizes folder patterns', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('src/codeowners.test.ts')).toEqual(['@fwuensche', '@rchoquet'])
  })

  // Assuming bin folder has no defined owners, but @fwuensche is the default owner
  it('recognizes default owners', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('bin/commands/run.ts')).toEqual(['@fwuensche'])
  })

  // Assuming js files are owned by @rchoquet
  it('recognizes file extension patterns', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('bin/codeowners.js')).toEqual(['@rchoquet'])
  })

  // Assuming the file does not exist, but matches an existing pattern
  it('returns who would theoretically own the file even tho it does not exist', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('bin/non-existing-file')).toEqual(['@fwuensche'])
  })
})
