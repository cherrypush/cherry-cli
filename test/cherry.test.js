import { exec } from 'child_process'

// TODO: this test should probably be moved to a different file
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
