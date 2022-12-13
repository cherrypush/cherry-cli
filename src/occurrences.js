import { eachLines } from './file.js'
import Codeowners from './owners.js'
import * as git from './git.js'
import glob from 'glob'
import cliProgress from 'cli-progress'

const codeOwners = new Codeowners()

export const findOccurrences = async (configuration) => {
  const occurrences = []
  const progress = new cliProgress.SingleBar(
    { format: '{bar} {value}/{total} files inspected' },
    cliProgress.Presets.shades_classic
  )

  const allFiles = await git.files()
  const allMetrics = configuration.metrics.map((metric) => ({
    ...metric,
    _files: metric.include ? new Set(glob(metric.include)) : new Set(allFiles),
  }))
  progress.start(allFiles.length, 0)

  allFiles.forEach((path) => {
    const metrics = allMetrics.filter((metric) => metric._files.has(path))

    eachLines(path, (line, lineNumber) => {
      metrics.forEach((metric) => {
        if (!line.match(metric.pattern)) return

        occurrences.push({
          file_path: path,
          line_number: lineNumber,
          owners: codeOwners.getOwners(path) || [],
          metric_name: metric.name,
        })
      })
    })
    progress.increment()
  })
  progress.stop()

  return occurrences
}
