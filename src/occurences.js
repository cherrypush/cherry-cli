import glob from 'glob'
import cliProgress from 'cli-progress'
import { eachLines } from './file.js'
import codeOwners from './codeowners.js'
import * as git from './git.js'

export const findOccurrences = async (configuration, owner, metric) => {
  const occurrences = []
  const progress = new cliProgress.SingleBar(
    { format: '{bar} {value}/{total} files inspected' },
    cliProgress.Presets.shades_classic
  )

  const allFiles = await git.files()
  const allMetrics = configuration.metrics
  const metrics = (metric ? allMetrics.filter(({ name }) => name === metric) : allMetrics).map((metric) => ({
    ...metric,
    _files: metric.include ? new Set(glob.sync(metric.include)) : true,
  }))
  const files = owner ? codeOwners.getFiles(owner) : allFiles
  progress.start(files.length, 0)
  files.forEach((path) => {
    const fileMetrics = metrics.filter((metric) => metric._files === true || metric._files.has(path))

    eachLines(path, (line, lineNumber) => {
      fileMetrics.forEach((metric) => {
        if (!line.match(metric.pattern)) return
        const owners = codeOwners.getOwners(path)
        occurrences.push({ file_path: path, line_number: lineNumber, owners, metric_name: metric.name })
      })
    })
    progress.increment()
  })
  progress.stop()

  return occurrences
}

// {
//   a_metric_name: {
//     owners: { team_a: 431, team_b: 42 },
//     total: 473,
//   },
//   ...
// }
export const aggregateOccurences = (occurences) => {
  const result = {}
  occurences.forEach((occurence) => {
    const metric = (result[occurence.metric_name] ||= { owners: {}, total: 0 })
    occurence.owners.forEach((owner) => {
      metric.owners[owner] ||= 0
      metric.owners[owner]++
    })
    metric.total++
  })
  return result
}
