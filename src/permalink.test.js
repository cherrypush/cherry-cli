import { describe, expect, it } from 'vitest'

import { buildPermalink } from './permalink.js'

describe('buildPermalink', () => {
  it('builds a permalink with a custom function', () => {
    const permalink = ({ filePath, lineNumber }) =>
      `https://gitlab.com/cherrypush/cherry-cli/blob/HEAD/${filePath}${lineNumber ? `#L${lineNumber}` : ''}`

    const projectName = 'cherrypush/cherry-cli'
    const filePath = 'src/permalink.js'
    const lineNumber = 1

    const result = buildPermalink(permalink, projectName, filePath, lineNumber)

    expect(result).toBe('https://gitlab.com/cherrypush/cherry-cli/blob/HEAD/src/permalink.js#L1')
  })
})
