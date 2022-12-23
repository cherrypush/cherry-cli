import codeOwners from './codeowners.js'
import minimatch from 'minimatch'

const minimatchCache = {}
const matchInclude = (path, include) => {
  const key = `${path}&&&${include}`
  if (!(key in minimatchCache)) minimatchCache[key] = minimatch(path, include)

  return minimatchCache[key]
}

export const findOccurrences = async ({ configuration, files, metric, progress }) => {
  const occurrences = []

  const metrics = metric ? configuration.metrics.filter(({ name }) => name === metric) : configuration.metrics
  progress?.start(files.length, 0)
  for (const file of files) {
    const fileMetrics = metrics.filter((metric) => !metric.include || matchInclude(file.path, metric.include))
    if (fileMetrics.length) {
      const lines = await file.readLines()
      lines.forEach((line, lineIndex) => {
        fileMetrics.forEach((metric) => {
          if (!line.match(metric.pattern)) return
          const owners = codeOwners.getOwners(file.path)
          occurrences.push({ file_path: file.path, line_number: lineIndex + 1, owners, metric_name: metric.name })
        })
      })
    }
    progress?.increment()
  }
  progress?.stop()

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
