import { describe, expect, it } from 'vitest'

import Codeowners from './codeowners.js'

describe('getOwners', () => {
  // Assuming src folder is owned by @fwuensche and @rchoquet
  it('returns returns @fwuensche for files inside src', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('src/codeowners.test.ts')).toEqual(['@fwuensche', '@rchoquet'])
  })

  // Assuming bin folder has no defined owners, but @fwuensche is the default owner
  it('returns an empty array for files inside bin', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('bin/commands/run.ts')).toEqual(['@fwuensche'])
  })

  // Assuming js files are owned by @rchoquet
  it('returns @fwuensche for js files', async () => {
    const codeowners = new Codeowners()
    expect(codeowners.getOwners('bin/codeowners.js')).toEqual(['@rchoquet'])
  })
})
