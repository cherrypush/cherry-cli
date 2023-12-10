import _ from 'lodash'
import minimatch from 'minimatch'
import pLimit from 'p-limit'
import Spinnies from 'spinnies'
import { panic } from './error.js'
import { buildPermalink } from './github.js'
import eslint from './plugins/eslint.js'
import jsCircularDependencies from './plugins/js_circular_dependencies.js'
import jsUnimported from './plugins/js_unimported.js'
import loc from './plugins/loc.js'
import npmOutdated from './plugins/npm_outdated.js'
import rubocop from './plugins/rubocop.js'
import yarnOutdated from './plugins/yarn_outdated.js'

const spinnies = new Spinnies()

const PLUGINS = {
  rubocop,
  eslint,
  loc,
  jsCircularDependencies,
  jsUnimported,
  npmOutdated,
  yarnOutdated,
}

const minimatchCache = {}
const matchPattern = (path, patternOrPatterns) => {
  const patterns = Array.isArray(patternOrPatterns) ? patternOrPatterns : [patternOrPatterns]

  return patterns.some((pattern) => {
    const key = `${path}&&&${pattern}`
    if (!(key in minimatchCache)) minimatchCache[key] = minimatch(path, pattern)

    return minimatchCache[key]
  })
}

const findFileOccurences = async (file, metrics) => {
  const relevantMetrics = metrics.filter((metric) => {
    const pathIncluded = metric.include ? matchPattern(file.path, metric.include) : true
    const pathExcluded = metric.exclude ? matchPattern(file.path, metric.exclude) : false
    return pathIncluded && !pathExcluded
  })
  if (!relevantMetrics.length) return []

  const occurrencesByMetric = {}
  const lines = await file.readLines()
  lines.forEach((line, lineIndex) => {
    relevantMetrics.forEach((metric) => {
      if (!line.match(metric.pattern)) return
      occurrencesByMetric[metric.name] ||= []
      occurrencesByMetric[metric.name].push({
        path: file.path,
        lineNumber: lineIndex + 1,
      })
    })
  })

  return Object.entries(occurrencesByMetric).flatMap(([metricName, occurrences]) => {
    const groupByFile = metrics.find((metric) => metric.name === metricName).groupByFile

    return groupByFile
      ? _(occurrences)
          .groupBy((occurrence) => occurrence.path)
          .mapValues((occurrences, path) => ({
            text: path,
            filePath: path,
            value: occurrences.length,
            metricName,
          }))
          .values()
          .flatten()
          .value()
      : occurrences.map((occurrence) => ({
          text: `${occurrence.path}:${occurrence.lineNumber}`,
          filePath: occurrence.path,
          lineNumber: occurrence.lineNumber,
          metricName,
        }))
  })
}

const matchPatterns = (files, metrics, quiet) => {
  if (!files.length || !metrics.length) return []

  if (!quiet) spinnies.add('patterns', { text: 'Matching patterns...', indent: 2 })
  // Limit number of concurrently opened files to avoid "Error: spawn EBADF"
  const limit = pLimit(10)
  const promise = Promise.all(files.map((file) => limit(() => findFileOccurences(file, metrics))))
  if (!quiet) promise.then(() => spinnies.succeed('patterns', { text: 'Matching patterns' }))

  return promise
}

const runEvals = (metrics, codeOwners, quiet) => {
  if (!metrics.length) return []

  if (!quiet) spinnies.add('evals', { text: 'Running eval()...', indent: 2 })
  const promise = Promise.all(
    metrics.map(async (metric) => {
      if (!quiet)
        spinnies.add(`metric_${metric.name}`, {
          text: `${metric.name}...`,
          indent: 4,
        })
      const result = (await metric.eval({ codeOwners })).map((occurrence) => ({
        ...occurrence,
        metricName: metric.name,
      }))
      if (!quiet) spinnies.succeed(`metric_${metric.name}`, { text: metric.name })
      return result
    })
  )
  if (!quiet) promise.then(() => spinnies.succeed('evals', { text: 'Running eval()' }))

  return promise
}

const runPlugins = async (plugins, quiet) => {
  if (!Object.keys(plugins).length) return []

  if (!quiet) spinnies.add('plugins', { text: 'Running plugins...', indent: 2 })
  const promise = Promise.all(
    Object.entries(plugins).map(async ([name, options]) => {
      const plugin = PLUGINS[name]
      if (!plugin) panic(`Unsupported '${name}' plugin\nExpected one of: ${Object.keys(PLUGINS).join(', ')}`)
      if (!quiet) spinnies.add(`plugin_${name}`, { text: `${name}...`, indent: 4 })
      const result = await plugin.run(options)
      if (!quiet) spinnies.succeed(`plugin_${name}`, { text: name })
      return result
    })
  )
  if (!quiet) promise.then(() => spinnies.succeed('plugins', { text: 'Running plugin' }))

  return promise
}

export const emptyMetric = (metricName) => ({
  metricName,
  text: 'No occurrences',
  value: 0,
})

const withEmptyMetrics = (occurrences, metrics = []) => {
  const occurrencesByMetric = _.groupBy(occurrences, 'metricName')
  const allMetricNames = _.uniq(metrics.map((metric) => metric.name).concat(Object.keys(occurrencesByMetric)))
  return allMetricNames.map((metricName) => occurrencesByMetric[metricName] || [emptyMetric(metricName)]).flat()
}

export const findOccurrences = async ({ configuration, files, metric, codeOwners, quiet }) => {
  let metrics = configuration.metrics

  if (metric) metrics = metrics.filter(({ name }) => name === metric)
  const [evalMetrics, fileMetrics] = _.partition(metrics, (metric) => metric.eval)
  let plugins = configuration.plugins || {}
  // From ['loc'] to { 'loc': {} } to handle deprecated array configuration for plugins
  if (Array.isArray(plugins)) plugins = plugins.reduce((acc, value) => ({ ...acc, [value]: {} }), {})

  const promise = Promise.all([
    matchPatterns(files, fileMetrics, quiet),
    runEvals(evalMetrics, codeOwners, quiet),
    runPlugins(plugins, quiet),
  ])

  const occurrences = _.flattenDeep(await promise).map(
    ({ text, value, metricName, filePath, lineNumber, url, owners }) => ({
      text,
      value,
      metricName,
      url: url !== undefined ? url : filePath && buildPermalink(configuration.project_name, filePath, lineNumber),
      owners: owners !== undefined ? owners : filePath && codeOwners.getOwners(filePath),
    })
  )

  return withEmptyMetrics(occurrences, metrics)
}
