import { promises as fs } from 'fs'
import intersection from 'lodash/intersection.js'
import codeOwners from './codeowners.js'
import * as git from './git.js'

class File {
  constructor(path) {
    this.path = path
  }

  async readLines() {
    return Buffer.from(await fs.readFile(this.path))
      .toString()
      .split(/\r\n|\r|\n/)
  }
}

class GitFile {
  constructor(path, sha) {
    this.path = path
    this.sha = sha
  }

  async readLines() {
    return await git.contentAtSha(this.path, this.sha)
  }
}

export const buildFilesAtSha = (paths, sha) => paths.map((path) => new GitFile(path, sha))

export const buildFiles = async (owner) => {
  const allPaths = await git.files()
  let selectedPaths = allPaths
  if (owner) selectedPaths = intersection(codeOwners.getFiles(owner), selectedPaths)

  return selectedPaths.map((path) => new File(path))
}
