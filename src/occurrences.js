import { readlines } from './readlines.js'
import Codeowners from './owners.js'
import * as git from './git.js'

const owners = new Codeowners()

export const findOccurrences = (configuration, fileToIgnore) => {
  const occurrences = []

  const sha = git.sha()
  git.files(fileToIgnore).forEach((filePath) => {
    try {
      configuration.metrics.forEach(({ name, pattern }) => {
        readlines(filePath, (line, lineNumber) => {
          if (!line.match(pattern)) return

          occurrences.push({
            commit_sha: sha,
            file_path: filePath,
            line_number: lineNumber,
            line_content: line.trim().slice(0, 120).replace(/\0/, ''),
            repo: configuration.repo,
            owners: owners.getOwner(filePath),
            metric_name: name,
          })
        })
      })
    } catch (error) {
      if (error.code === 'ENOENT') return // TODO: understand why a file could not exist
      if (error.code === 'EISDIR') return
      throw error
    }
  })

  return occurrences
}
