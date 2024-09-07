import { describe, expect, it } from 'vitest'

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

describe('cherry', () => {
  it('explains the usage', async () => {
    try {
      await execAsync('node bin/cherry.js')
    } catch (error) {
      expect(error.stderr).toContain('Usage: cherry [options] [command]')
      expect(error.stderr).toContain('init')
      expect(error.stderr).toContain('run')
      expect(error.stderr).toContain('push')
      expect(error.stderr).toContain('diff')
      expect(error.stderr).toContain('backfill')
      expect(error.stderr).toContain('diff')
      expect(error.stderr).toContain('help')
    }
  })
})
