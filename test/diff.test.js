import { exec } from 'child_process'

describe('cherry diff', () => {
  test('should exit with an error if --api-key is missing', (done) => {
    exec('node bin/cherry.js diff --metric test', (error, _stdout, stderr) => {
      expect(error.code).toBe(1)
      expect(stderr).toContain('API key is missing')
      done()
    })
  }, 10000)

  test('should exit with an error if --metric is missing', (done) => {
    exec('node bin/cherry.js diff --api-key test', (error, _stdout, stderr) => {
      expect(error.code).toBe(1)
      expect(stderr).toContain(`required option '--metric <metric>' not specified`)
      done()
    })
  })

  test('handles unknown API keys', (done) => {
    exec('node bin/cherry.js diff --metric TODO --api-key test', (error, _stdout, stderr) => {
      expect(error.code).toBe(1)
      expect(stderr).toContain('Unknown API key')
      done()
    })
  })
})
