import cliProgress from 'cli-progress'
import { eachLines } from './file.js'
import codeOwners from './codeowners.js'
import * as git from './git.js'
import minimatch from 'minimatch'

const minimatchCache = {}
const matchInclude = (path, include) => {
  const key = `${path}&&&${include}`
  if (!(key in minimatchCache)) minimatchCache[key] = minimatch(path, include)

  return minimatchCache[key]
}

export const findOccurrences = async (configuration, owner, metric) => {
  const occurrences = []
  const progress = new cliProgress.SingleBar(
    { format: '{bar} {value}/{total} files inspected' },
    cliProgress.Presets.shades_classic
  )

  const allFiles = await git.files()
  const metrics = metric ? configuration.metrics.filter(({ name }) => name === metric) : configuration.metrics
  const files = owner ? codeOwners.getFiles(owner) : allFiles
  progress.start(files.length, 0)
  files.forEach((path) => {
    const fileMetrics = metrics.filter((metric) => !metric.include || matchInclude(path, metric.include))
    if (fileMetrics.length)
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
