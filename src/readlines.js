import lineByLine from 'n-readlines'
import fs from 'fs'

export const readlines = (path, callback) => {
  if (!fs.existsSync(path)) {
    return
  }
  const liner = new lineByLine(path)

  let lineNumber = 1
  let lineBuffer
  while ((lineBuffer = liner.next())) {
    const line = lineBuffer.toString()
    callback(line, lineNumber)
    lineNumber++
  }
}
