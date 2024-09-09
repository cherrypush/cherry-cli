import { describe, expect, it } from 'vitest'

import { expectError } from './helpers'

describe('cherry', () => {
  it('explains the usage', async () => {
    const error = await expectError('node ./bin/cherry.js')
    expect(error.stderr).toContain('Usage: cherry [options] [command]')
    expect(error.stderr).toContain('init')
    expect(error.stderr).toContain('run')
    expect(error.stderr).toContain('push')
    expect(error.stderr).toContain('diff')
    expect(error.stderr).toContain('backfill')
    expect(error.stderr).toContain('diff')
    expect(error.stderr).toContain('help')
  })
})
