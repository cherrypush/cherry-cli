import * as git from './git.js'

import { promises as fs } from 'fs'
import intersection from 'lodash/intersection.js'

/**
 * Reads the lines from a file at a given path.
 *
 * @param {string} path - The path to the file.
 * @returns {Promise<string[]>} A promise that resolves to an array of lines in the file, or an empty array if the file doesn't exist or is a directory.
 */
export async function readLines(path) {
  try {
    const data = await fs.readFile(path)
    return Buffer.from(data)
      .toString()
      .split(/\r\n|\r|\n/)
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') return []
    throw error
  }
}

export const getFiles = async (owners, codeOwners) => {
  const allPaths = await git.files()
  let selectedPaths = allPaths
  if (owners) selectedPaths = intersection(codeOwners.getFiles(owners), selectedPaths)

  return selectedPaths
}
