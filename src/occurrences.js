import { executeWithTiming, warnsAboutLongRunningTasks } from './helpers/timer.js'

import Spinnies from 'spinnies'
import _ from 'lodash'
import { buildPermalink } from './permalink.js'
import eslint from './plugins/eslint.js'
import jsCircularDependencies from './plugins/js_circular_dependencies.js'
import jsUnimported from './plugins/js_unimported.js'
import loc from './plugins/loc.js'
import minimatch from 'minimatch'
import npmOutdated from './plugins/npm_outdated.js'
import pLimit from 'p-limit'
import { panic } from './error.js'
import rubocop from './plugins/rubocop.js'
import yarnOutdated from './plugins/yarn_outdated.js'

/**
 * @typedef {import('./types.js').Occurrence} Occurrence
 * @typedef {import('./types.js').Metric} Metric
 * @typedef {import('./types.js').Configuration} Configuration
 * @typedef {import('./types.js').File} File
 */

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

/**
 * A cache object that stores the results of path matches to avoid recomputation.
 * The keys are a combination of the path and pattern, and the values are the result of the minimatch operation.
 * @type {Object<string, boolean>}
 */
const minimatchCache = {}

/**
 * Matches a path against a pattern or an array of patterns.
 * The result is cached to avoid recomputing the same match.
 * @param {string} path - The path to match.
 * @param {string|string[]} patternOrPatterns - The pattern or patterns to match against.
 * @returns {boolean} Whether the path matches the pattern or patterns.
 */
const matchPattern = (path, patternOrPatterns) => {
  const patterns = Array.isArray(patternOrPatterns) ? patternOrPatterns : [patternOrPatterns]

  return patterns.some((pattern) => {
    const key = `${path}&&&${pattern}`
    if (!(key in minimatchCache)) minimatchCache[key] = minimatch(path, pattern)

    return minimatchCache[key]
  })
}

/**
 * Finds occurrences in a file based on the provided metrics.
 * @param {File} file
 * @param {Metric[]} metrics
 * @returns {Promise<Occurrence[]>}
 */
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

/**
 * @param {File[]} files
 * @param {Metric[]} metrics
 * @param {boolean} quiet
 * @returns {Promise<Occurrence[]>}
 */
const matchPatterns = async (files, metrics, quiet) => {
  if (!files.length || !metrics.length) return []

  if (!quiet) spinnies.add('patterns', { text: 'Matching patterns...', indent: 2 })

  // Limit number of concurrently opened files to avoid "Error: spawn EBADF"
  const limit = pLimit(10)
  const promise = executeWithTiming(
    () => Promise.all(files.map((file) => limit(() => findFileOccurences(file, metrics)))),
    'All pattern metrics together'
  )

  if (!quiet) promise.then(() => spinnies.succeed('patterns', { text: 'Matching patterns' }))

  return promise
}

/**
 * @param {Metric[]} metrics
 * @param {*} codeOwners
 * @param {boolean} quiet
 * @returns {Promise<Occurrence[]>}
 */
const runEvals = (metrics, codeOwners, quiet) => {
  if (!metrics.length) return []

  if (!quiet) spinnies.add('evals', { text: 'Running eval()...', indent: 2 })

  const promise = Promise.all(
    metrics.map(async (metric) => {
      if (!quiet) {
        spinnies.add(`metric_${metric.name}`, {
          text: `${metric.name}...`,
          indent: 4,
        })
      }

      const occurrences = await executeWithTiming(
        async () => await metric.eval({ codeOwners }),
        `Metric '${metric.name}'`
      )
      const result = occurrences.map((occurrence) => ({ ...occurrence, metricName: metric.name }))

      if (!quiet) spinnies.succeed(`metric_${metric.name}`, { text: metric.name })
      return result
    })
  )
  if (!quiet) promise.then(() => spinnies.succeed('evals', { text: 'Running eval()' }))

  return promise
}

const runPlugins = async (plugins = {}, quiet) => {
  if (typeof plugins !== 'object' || plugins === null) panic('Plugins should be an object')
  if (!Object.keys(plugins).length) return []

  if (!quiet) spinnies.add('plugins', { text: 'Running plugins...', indent: 2 })
  const promise = Promise.all(
    Object.entries(plugins).map(async ([name, options]) => {
      const plugin = PLUGINS[name]
      if (!plugin) panic(`Unsupported '${name}' plugin\nExpected one of: ${Object.keys(PLUGINS).join(', ')}`)
      if (!quiet) spinnies.add(`plugin_${name}`, { text: `${name}...`, indent: 4 })
      const result = executeWithTiming(async () => await plugin.run(options), `Plugin '${name}'`)
      if (!quiet) spinnies.succeed(`plugin_${name}`, { text: name })
      return result
    })
  )
  if (!quiet) promise.then(() => spinnies.succeed('plugins', { text: 'Running plugin' }))

  return promise
}

/**
 * Creates an occurrence with value 0 for a metric that has no occurrences.
 *
 * @param {string} metricName - The name of the metric.
 * @returns {Occurrence} An occurrence object.
 */
export const emptyMetric = (metricName) => ({
  metricName,
  text: 'No occurrences',
  value: 0,
})

/**
 * Adds empty metrics to a list of occurrences for any metrics that have no occurrences.
 *
 * @param {Occurrence[]} occurrences - The list of occurrences.
 * @param {Metric[]} metrics - The list of metrics.
 * @returns {Occurrence[]} A list of occurrences including any empty metrics for metrics with no occurrences.
 */
const withEmptyMetrics = (occurrences, metrics = []) => {
  const occurrencesByMetric = _.groupBy(occurrences, 'metricName')
  const allMetricNames = _.uniq(metrics.map((metric) => metric.name).concat(Object.keys(occurrencesByMetric)))
  return allMetricNames.map((metricName) => occurrencesByMetric[metricName] || [emptyMetric(metricName)]).flat()
}

/**
 * Finds occurrences based on the provided configuration.
 *
 * @param {Object} options
 * @param {Configuration} options.configuration - The configuration object.
 * @param {import('./types.js').File[]} options.files - The list of files.
 * @param {string[]} [options.metricNames] - The list of metric names to run.
 * @param {import('./types.js').Codeowners} options.codeOwners - The code owners.
 * @param {boolean} options.quiet - Whether to reduce output to a minimum.
 * @returns {Promise<Occurrence[]>} The list of occurrences.
 */
export const findOccurrences = async ({ configuration, files, metricNames, codeOwners, quiet }) => {
  let metrics = configuration.metrics
  const { project_name: projectName, permalink } = configuration

  // Prevent running all metrics if a subset is provided
  if (metricNames) metrics = metrics.filter(({ name }) => metricNames.includes(name))

  // Separate metrics into eval and file metrics
  const [evalMetrics, fileMetrics] = _.partition(metrics, (metric) => metric.eval)

  const result = await Promise.all([
    matchPatterns(files, fileMetrics, quiet),
    runEvals(evalMetrics, codeOwners, quiet),
    runPlugins(configuration.plugins, quiet),
  ])

  warnsAboutLongRunningTasks(5000)

  const occurrences = _.flattenDeep(result).map(({ text, value, metricName, filePath, lineNumber, url, owners }) => ({
    text,
    value,
    metricName,
    // The url might have been provided by plugins or eval metrics
    url: url !== undefined ? url : filePath && buildPermalink(permalink, projectName, filePath, lineNumber),
    owners: owners !== undefined ? owners : filePath && codeOwners.getOwners(filePath),
  }))

  return withEmptyMetrics(occurrences, metrics)
}
