import minimatch from 'minimatch'
import pLimit from 'p-limit'
import codeOwners from './codeowners.js'

const minimatchCache = {}
const matchInclude = (path, include) => {
  const key = `${path}&&&${include}`
  if (!(key in minimatchCache)) minimatchCache[key] = minimatch(path, include)

  return minimatchCache[key]
}

const findFileOccurences = async (file, metrics) => {
  const relevantMetrics = metrics.filter((metric) => !metric.include || matchInclude(file.path, metric.include))
  if (!relevantMetrics.length) return []

  const occurences = []
  const lines = await file.readLines()
  lines.forEach((line, lineIndex) => {
    relevantMetrics.forEach((metric) => {
      if (!line.match(metric.pattern)) return
      const owners = codeOwners.getOwners(file.path)
      occurences.push({ file_path: file.path, line_number: lineIndex + 1, owners, metric_name: metric.name })
    })
  })
  return occurences
}

export const findOccurrences = async ({ configuration, files, metric, progress }) => {
  // Limit number of concurrently opened files
  const limit = pLimit(10)

  const metrics = metric ? configuration.metrics.filter(({ name }) => name === metric) : configuration.metrics
  progress?.start(files.length, 0)
  const promises = files.map(async (file) => {
    return limit(() => {
      progress?.increment()
      return findFileOccurences(file, metrics)
    })
  })
  const occurrences = (await Promise.all(promises)).flat()
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
