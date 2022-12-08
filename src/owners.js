import { findUpSync } from 'find-up'
import fs from 'fs'
import glob from 'glob'
import path from 'path'
import trueCasePath from 'true-case-path'
import { isDirectory } from './file.js'

const { trueCasePathSync } = trueCasePath

class Codeowners {
  constructor(currentPath, fileName = 'CODEOWNERS') {
    this.ownersByFile = {}
    const pathOrCwd = currentPath || process.cwd()

    const codeownersPath = findUpSync(
      [`.github/${fileName}`, `.gitlab/${fileName}`, `docs/${fileName}`, `${fileName}`],
      { cwd: pathOrCwd }
    )

    if (!codeownersPath) throw new Error(`Could not find a CODEOWNERS file`)

    const codeownersFilePath = trueCasePathSync(codeownersPath)
    let codeownersDirectory = path.dirname(codeownersFilePath)

    // We might have found a bare codeowners file or one inside the three supported subdirectories.
    // In the latter case the project root is up another level.
    if (codeownersDirectory.match(/\/(.github|.gitlab|docs)$/i)) codeownersDirectory = path.dirname(codeownersDirectory)

    const codeownersFile = path.basename(codeownersFilePath)

    if (codeownersFile !== fileName)
      throw new Error(`Found a ${fileName} file but it was lower-cased: ${codeownersFilePath}`)

    if (isDirectory(codeownersFilePath))
      throw new Error(`Found a ${fileName} but it's a directory: ${codeownersFilePath}`)

    const lines = fs
      .readFileSync(codeownersFilePath)
      .toString()
      .split(/\r\n|\r|\n/)

    for (const line of lines) {
      if (!line) continue
      if (line.startsWith('#')) continue

      const [codeownersPath, ...owners] = line.split(/\s+/)

      for (const file of this.getFiles(codeownersPath)) {
        const existingOwners = this.ownersByFile[file] || []
        this.ownersByFile[file] = [...new Set(existingOwners.concat(owners))]
      }
    }
  }

  getFiles(codeownersPath) {
    if (codeownersPath.includes('*')) return glob.sync(codeownersPath, { nodir: true })
    if (isDirectory(codeownersPath)) {
      return glob.sync(path.join(codeownersPath, '**/*'), { nodir: true })
    }
    return codeownersPath
  }

  getOwners(file) {
    return this.ownersByFile[file]
  }
}

export default Codeowners
