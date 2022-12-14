import lineByLine from 'n-readlines'
import fs from 'fs'

export const eachLines = (path, callback) => {
  try {
    const liner = new lineByLine(path)
    let lineNumber = 1

    let lineBuffer
    while ((lineBuffer = liner.next())) {
      const line = lineBuffer.toString()
      callback(line, lineNumber)
      lineNumber++
    }
  } catch (error) {
    if (error.code === 'ENOENT') return // TODO: understand why a file could not exist
    if (error.code === 'EISDIR') return
    throw error
  }
}

export const isDirectory = (path) => {
  try {
    return fs.statSync(path).isDirectory()
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}
