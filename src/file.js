import lineByLine from 'n-readlines'
import fs from 'fs'

export const eachLines = (path, callback) => {
  const liner = new lineByLine(path)
  let lineNumber = 1

  let lineBuffer
  while ((lineBuffer = liner.next())) {
    const line = lineBuffer.toString()
    callback(line, lineNumber)
    lineNumber++
  }
}

export const isDirectory = (path) => fs.statSync(path).isDirectory()
