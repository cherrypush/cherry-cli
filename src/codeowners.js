import { findUpSync } from 'find-up'
import fs from 'fs'
import glob from 'glob'
import uniq from 'lodash/uniq.js'
import path from 'path'
import trueCasePath from 'true-case-path'
import { isDirectory } from './file.js'

const { trueCasePathSync } = trueCasePath

class Codeowners {
  constructor() {
    this.ownersByFile = {}
    this.initialized = false
  }

  init() {
    if (this.initialized) return

    const fileName = 'CODEOWNERS'

    const codeownersPath = findUpSync(
      [`.github/${fileName}`, `.gitlab/${fileName}`, `docs/${fileName}`, `${fileName}`],
      { cwd: process.cwd() }
    )

    if (!codeownersPath) return

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

      for (const file of this.globFiles(codeownersPath)) {
        const existingOwners = this.ownersByFile[file] || []
        this.ownersByFile[file] = [...new Set(existingOwners.concat(owners))]
      }
    }
    this.initialized = true
  }

  globFiles(codeownersPath) {
    if (codeownersPath.includes('*')) return glob.sync(codeownersPath, { nodir: true })
    if (isDirectory(codeownersPath)) return glob.sync(path.join(codeownersPath, '**/*'), { nodir: true })
    return [codeownersPath]
  }

  getFiles(owner) {
    this.init()
    return uniq(
      Object.entries(this.ownersByFile)
        .filter(([, owners]) => owners.includes(owner))
        .map(([file]) => file)
        .flat()
    )
  }

  getOwners(file) {
    this.init()
    return this.ownersByFile[file] || []
  }

  listOwners() {
    this.init()
    return uniq(Object.values(this.ownersByFile).flat())
  }
}

export default new Codeowners()
