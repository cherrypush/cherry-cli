import { findUpSync } from 'find-up'
import fs from 'fs'
import glob from 'glob'
import intersection from 'lodash/intersection.js'
import { isDirectory } from './file.js'
import path from 'path'
import trueCasePath from 'true-case-path'
import uniq from 'lodash/uniq.js'

// TODO: This should be dynamically generated from the .gitignore file
const IGNORES = ['**/node_modules/**', '**/.git/**', '**/.github/**', '**/.gitlab/**', '**/docs/**']

const { trueCasePathSync } = trueCasePath

class Codeowners {
  ownersByFile: Record<string, string[]>

  constructor(currentPath?: string) {
    this.ownersByFile = {}
    this.init(currentPath)
  }

  init(currentPath?: string) {
    // Find the CODEOWNERS file or use the one provided as an argument
    const pathOrCwd = currentPath || process.cwd()
    const codeownersPath = findUpSync(['.github/CODEOWNERS', '.gitlab/CODEOWNERS', 'docs/CODEOWNERS', 'CODEOWNERS'], {
      cwd: pathOrCwd,
    })

    if (!codeownersPath) return

    const codeownersFilePath = trueCasePathSync(codeownersPath)
    let codeownersDirectory = path.dirname(codeownersFilePath)

    // We might have found a bare codeowners file or one inside the three supported subdirectories.
    // In the latter case the project root is up another level.
    if (codeownersDirectory.match(/\/(.github|.gitlab|docs)$/i)) codeownersDirectory = path.dirname(codeownersDirectory)

    const codeownersFile = path.basename(codeownersFilePath)

    if (codeownersFile !== 'CODEOWNERS')
      throw new Error(`Found a CODEOWNERS file but it was lower-cased: ${codeownersFilePath}`)

    if (isDirectory(codeownersFilePath))
      throw new Error(`Found a CODEOWNERS but it's a directory: ${codeownersFilePath}`)

    const codeownersLines = fs
      .readFileSync(codeownersFilePath)
      .toString()
      .split(/\r\n|\r|\n/) // Split by line breaks
      .filter(Boolean) // Remove empty lines
      .map((line) => line.trim()) // Remove leading and trailing whitespace

    for (const line of codeownersLines) {
      // Remove comments
      if (line.startsWith('#')) continue

      // Split the line into path and owners
      const [codeownersPattern, ...owners] = line.split(/\s+/)

      // We do it in the order of the file, so that the last one wins

      for (const file of this.#globPatterns(codeownersPattern)) {
        this.ownersByFile[file] = uniq(owners)
      }
    }
  }

  /** Returns the files from the codebase mathing the given pattern */
  #globPatterns(pattern: string) {
    if (pattern.includes('*')) return glob.sync(pattern.replace('*', '**/*'), { nodir: true, ignore: IGNORES })

    if (pattern.endsWith('/')) {
      if (pattern.startsWith('/')) {
        return glob.sync(path.join(pattern.substring(1), '**', '*'), { nodir: true, ignore: IGNORES })
      } else {
        return glob.sync(path.join('**', pattern, '*'), { nodir: true, ignore: IGNORES })
      }
    }
    return [pattern]
  }

  getOwners(file: string) {
    return this.ownersByFile[file] || []
  }

  getFiles(owners: string[]) {
    return uniq(
      Object.entries(this.ownersByFile)
        .filter(([, fileOwners]) => intersection(owners, fileOwners).length > 0)
        .map(([file]) => file)
        .flat()
    )
  }
}

export default Codeowners
