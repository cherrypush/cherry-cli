import { eachLines } from './file.js'
import Codeowners from './owners.js'
import * as git from './git.js'

const codeOwners = new Codeowners()

export const findOccurrences = async (configuration) => {
  const occurrences = []
  const sha = await git.sha()

  const files = await git.files()
  files.forEach((filePath) => {
    try {
      eachLines(filePath, (line, lineNumber) => {
        configuration.metrics.forEach(({ name, pattern }) => {
          if (!line.match(pattern)) return

          occurrences.push({
            commit_sha: sha,
            file_path: filePath,
            line_number: lineNumber,
            line_content: line.trim().slice(0, 120).replace(/\0/, ''),
            repo: configuration.repo,
            owners: codeOwners.getOwners(filePath),
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
