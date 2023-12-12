import fs from 'fs'
import { exec } from 'child_process'

const TEMPORARY_FILE_PATH = 'test_temporary_file'

beforeEach(() => {
  if (fs.existsSync(TEMPORARY_FILE_PATH)) {
    fs.unlinkSync(TEMPORARY_FILE_PATH)
  }
})

describe('cherry diff', () => {
  test('averts that --api-key is deprecated', (done) => {
    exec('node bin/cherry.js diff --quiet --metric TODO --api-key test', (error, stdout) => {
      expect(error).toBe(null)
      expect(stdout).toContain('WARNING: --api-key is deprecated and will raise an error in the future.')
      expect(stdout).toContain('Metric: TODO')
      done()
    })
  })

  test('should exit with an error if --metric is missing', (done) => {
    exec('node bin/cherry.js diff --quiet', (error, _stdout, stderr) => {
      expect(error.code).toBe(1)
      expect(stderr).toContain(`required option '--metric <metric>' not specified`)
      done()
    })
  })

  test('can take multiple metrics', (done) => {
    exec('node bin/cherry.js diff --quiet --metric TODO --metric "[loc] JavaScript"', (error, stdout) => {
      expect(error).toBe(null)
      expect(stdout).toContain('Metric: TODO')
      expect(stdout).toContain('Metric: [loc] JavaScript')
      done()
    })
  })

  test('requires to commit changes before running cherry diff', (done) => {
    fs.writeFileSync(TEMPORARY_FILE_PATH, 'unexpected content')

    exec('node bin/cherry.js diff --quiet --metric TODO', (error, _stdout, stderr) => {
      expect(error.code).toBe(1)
      expect(stderr).toContain('Please commit your changes before running cherry diff.')
      done()
    })
  })

  test('does not require to commit changes when --input-file is provided', (done) => {
    exec('node bin/cherry.js diff --quiet --metric TODO --input-file test --api-key test', (error, _stdout, stderr) => {
      expect(error.code).toBe(1)
      expect(stderr).not.toContain('Please commit your changes before running cherry diff.')
      done()
    })
  })
})
