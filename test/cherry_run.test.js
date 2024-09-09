import { describe, expect, it } from 'vitest'

import { execAsync } from './helpers'

describe('cherry run', () => {
  it('runs all metrics from config file', async () => {
    const { stdout } = await execAsync('tsx ./bin/cherry.ts run')
    expect(stdout).toContain('JS circular dependencies')
    expect(stdout).toContain('TODO')
  })

  it('runs only selected metric', async () => {
    const { stdout } = await execAsync('tsx ./bin/cherry.ts run --metric TODO')
    expect(stdout).toContain('Total occurrences:')
  })
})
