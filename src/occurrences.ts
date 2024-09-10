import { Configuration, EvalMetric, Metric, Occurrence, PatternMetric, PluginName, Plugins } from './types.js'
import { executeWithTiming, warnsAboutLongRunningTasks } from './helpers/timer.js'

import Spinnies from 'spinnies'
import _ from 'lodash'
import { buildPermalink } from './permalink.js'
import eslint from './plugins/eslint.js'
import { isEvalMetric } from '../bin/helpers.js'
import jsCircularDependencies from './plugins/js_circular_dependencies.js'
import jsUnimported from './plugins/js_unimported.js'
import loc from './plugins/loc.js'
import minimatch from 'minimatch'
import npmOutdated from './plugins/npm_outdated.js'
import pLimit from 'p-limit'
import { panic } from './error.js'
import { readLines } from './files.js'
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

const minimatchCache: Record<string, boolean> = {}

const matchPattern = (path: string, patternOrPatterns: string | string[]) => {
  const patterns = Array.isArray(patternOrPatterns) ? patternOrPatterns : [patternOrPatterns]

  return patterns.some((pattern) => {
    const key = `${path}&&&${pattern}`
    if (!(key in minimatchCache)) minimatchCache[key] = minimatch(path, pattern)

    return minimatchCache[key]
  })
}

const findFileOccurences = async (filePath: string, metrics: PatternMetric[]) => {
  const relevantMetrics = metrics.filter((metric) => {
    const pathIncluded = metric.include ? matchPattern(filePath, metric.include) : true
    const pathExcluded = metric.exclude ? matchPattern(filePath, metric.exclude) : false
    return pathIncluded && !pathExcluded
  })
  if (!relevantMetrics.length) return []

  const occurrencesByMetric: Record<string, { path: string; lineNumber: number }[]> = {}
  const lines = await readLines(filePath)
  lines.forEach((line, lineIndex) => {
    relevantMetrics.forEach((metric) => {
      // @ts-expect-error TODO: check if we can pass an empty string instead of undefined or skip this step entirely if no pattern was provided
      if (!line.match(metric.pattern)) return
      occurrencesByMetric[metric.name] ||= []
      occurrencesByMetric[metric.name].push({
        path: filePath,
        lineNumber: lineIndex + 1,
      })
    })
  })

  // @ts-expect-error TODO: properly type this
  return Object.entries(occurrencesByMetric).flatMap(([metricName, occurrences]) => {
    // @ts-expect-error TODO: properly type this
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

const matchPatterns = async (files: string[], metrics: PatternMetric[], quiet: boolean): Promise<Occurrence[]> => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runEvals = async (metrics: EvalMetric[], codeOwners: any, quiet: boolean): Promise<Occurrence[][]> => {
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

      // TODO: properly type executeWithTiming and remove the cast
      const occurrences = (await executeWithTiming(
        async () => await metric.eval({ codeOwners }),
        `Metric '${metric.name}'`
      )) as Occurrence[]

      const result = occurrences.map((occurrence) => ({ ...occurrence, metricName: metric.name }) as Occurrence)

      if (!quiet) spinnies.succeed(`metric_${metric.name}`, { text: metric.name })
      return result
    })
  )

  if (!quiet) promise.then(() => spinnies.succeed('evals', { text: 'Running eval()' }))

  return promise
}

const runPlugins = async (plugins: Plugins = {}, quiet: boolean): Promise<Occurrence[][]> => {
  if (typeof plugins !== 'object' || plugins === null) panic('Plugins should be an object')
  if (!Object.keys(plugins).length) return []

  if (!quiet) spinnies.add('plugins', { text: 'Running plugins...', indent: 2 })

  const promise = Promise.all(
    Object.entries(plugins).map(async ([name, options]) => {
      const plugin = PLUGINS[name as PluginName]
      if (!plugin) panic(`Unsupported '${name}' plugin\nExpected one of: ${Object.keys(PLUGINS).join(', ')}`)
      if (!quiet) spinnies.add(`plugin_${name}`, { text: `${name}...`, indent: 4 })
      // @ts-expect-error TODO: properly type plugin options
      const result = executeWithTiming(async () => await plugin.run(options), `Plugin '${name}'`)
      if (!quiet) spinnies.succeed(`plugin_${name}`, { text: name })
      return result
    })
  )

  if (!quiet) promise.then(() => spinnies.succeed('plugins', { text: 'Running plugin' }))

  return promise
}

export const emptyMetric = (metricName: string) => ({
  metricName,
  text: 'No occurrences',
  value: 0,
})

const withEmptyMetrics = (occurrences: Occurrence[], metrics: Metric[] = []) => {
  const occurrencesByMetric: Record<string, Occurrence[]> = _.groupBy(occurrences, 'metricName')
  const allMetricNames: string[] = _.uniq(metrics.map((metric) => metric.name).concat(Object.keys(occurrencesByMetric)))
  return allMetricNames.map((metricName) => occurrencesByMetric[metricName] || [emptyMetric(metricName)]).flat()
}

export const findOccurrences = async ({
  configuration,
  filePaths,
  metricNames,
  codeOwners,
  quiet,
}: {
  configuration: Configuration
  filePaths: string[]
  metricNames?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  codeOwners: any
  quiet: boolean
}) => {
  let metrics = configuration.metrics
  const { project_name: projectName, permalink } = configuration

  // Prevent running all metrics if a subset is provided
  if (metricNames) metrics = metrics.filter(({ name }) => metricNames.includes(name))

  // Separate metrics into eval and pattern metrics
  const [evalMetrics, patternMetrics] = _.partition(metrics, isEvalMetric)

  const result = await Promise.all([
    matchPatterns(filePaths, patternMetrics, quiet),
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
