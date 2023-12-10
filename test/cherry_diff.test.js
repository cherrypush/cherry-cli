import { exec } from 'child_process'

describe('cherry diff', () => {
  test('should exit with an error if --api-key is missing', (done) => {
    exec('node bin/cherry.js diff --metric test', (error, _stdout, stderr) => {
      expect(error.code).toBe(1)
      expect(stderr).toContain('API key is missing') // TODO: cherry diff should not depend on API key
      done()
    })
  })

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
      expect(stderr).toContain('Unknown API key') // TODO: cherry diff should not depend on API key
      done()
    })
  })

  test('can take multiple metrics', (done) => {
    exec('node bin/cherry.js diff --metric TODO --metric "[loc] JavaScript"', (error, _stdout, stderr) => {
      expect(error.code).toBe(1)
      expect(stderr).toContain('Unknown API key') // TODO: cherry diff should not depend on API key
      done()
    })
  })
})
