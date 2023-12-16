import { exec } from 'child_process'

describe('cherry run', () => {
  test('runs all metrics from config file', (done) => {
    exec('node bin/cherry.js run', (_error, stdout) => {
      expect(stdout).toContain('JS circular dependencies')
      expect(stdout).toContain('TODO')
      done()
    })
  })

  test('runs only selected metric', (done) => {
    exec('node bin/cherry.js run --metric TODO', (_error, stdout) => {
      expect(stdout).toContain('Total occurrences:')
      done()
    })
  })
})
