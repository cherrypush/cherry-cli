import * as git from './git.js'

import { promises as fs } from 'fs'
import intersection from 'lodash/intersection.js'

class File {
  constructor(path) {
    this.path = path
  }

  async readLines() {
    try {
      return Buffer.from(await fs.readFile(this.path))
        .toString()
        .split(/\r\n|\r|\n/)
    } catch (error) {
      if (error.code === 'ENOENT') return []
      if (error.code === 'EISDIR') return []
      throw error
    }
  }
}

/**
 * Creates a new File object from a file path.
 *
 * @param {string} path - The path to the file.
 * @returns {File} A new File object for the given path.
 */
function createFileObject(path) {
  return new File(path)
}

/**
 * Retrieves files from the repository, filtered by owners if provided.
 *
 * @param {string[]} owners - An optional array of owners to filter the files by.
 * @param {Object} codeOwners - An object that provides methods to get files based on owners.
 * @param {function(string[]): string[]} codeOwners.getFiles - A function that returns an array of file paths for the given owners.
 * @returns {Promise<File[]>} A promise that resolves to an array of File objects.
 */
export async function getFiles(owners, codeOwners) {
  const allPaths = await git.files()
  let selectedPaths = allPaths
  if (owners) selectedPaths = intersection(codeOwners.getFiles(owners), selectedPaths)

  return selectedPaths.map(createFileObject)
}
