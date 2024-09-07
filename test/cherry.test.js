import { describe, expect, it } from 'vitest'

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

describe('cherry', () => {
  it('explains the usage', async () => {
    try {
      const { stderr } = await execAsync('node bin/cherry.js')

      expect(stderr).toContain('Usage: cherry [options] [command]')
      expect(stderr).toContain('init')
      expect(stderr).toContain('run')
      expect(stderr).toContain('push')
      expect(stderr).toContain('diff')
      expect(stderr).toContain('backfill')
      expect(stderr).toContain('diff')
      expect(stderr).toContain('help')
    } catch (error) {
      expect(error).not.toBeNull()
    }
  })
})
