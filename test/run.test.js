import { exec } from 'child_process'

describe('cherry', () => {
  test('explains the usage', (done) => {
    exec('node bin/cherry.js', (error, _stdout, stderr) => {
      expect(error).not.toBeNull()
      expect(stderr).toContain('Usage: cherry [options] [command]')
      expect(stderr).toContain('init')
      expect(stderr).toContain('run')
      expect(stderr).toContain('push')
      expect(stderr).toContain('diff')
      expect(stderr).toContain('backfill')
      expect(stderr).toContain('diff')
      expect(stderr).toContain('help')
      done()
    })
  })
})

describe('cherry run', () => {
  test('runs all metrics from config file', (done) => {
    exec('node bin/cherry.js run', (_error, stdout) => {
      expect(stdout).toContain('JS circular dependencies')
      expect(stdout).toContain('npm outdated dependencies (package.json)')
      expect(stdout).toContain('npx unimported files')
      expect(stdout).toContain('TODO')
      done()
    })
  }, 10000)
})

describe('cherry diff', () => {
  test('should exit with an error if --api-key is missing', (done) => {
    exec('node bin/cherry.js diff --metric test', (error, _stdout, stderr) => {
      expect(error.code).toBe(1)
      expect(stderr).toContain('API key is missing')
      done()
    })
  })
})
