'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.findOccurrences = exports.emptyMetric = void 0
const lodash_1 = __importDefault(require('lodash'))
const minimatch_1 = __importDefault(require('minimatch'))
const p_limit_1 = __importDefault(require('p-limit'))
const spinnies_1 = __importDefault(require('spinnies'))
const error_js_1 = require('./error.js')
const github_js_1 = require('./github.js')
const eslint_js_1 = __importDefault(require('./plugins/eslint.js'))
const js_circular_dependencies_js_1 = __importDefault(require('./plugins/js_circular_dependencies.js'))
const js_unimported_js_1 = __importDefault(require('./plugins/js_unimported.js'))
const loc_js_1 = __importDefault(require('./plugins/loc.js'))
const npm_outdated_js_1 = __importDefault(require('./plugins/npm_outdated.js'))
const rubocop_js_1 = __importDefault(require('./plugins/rubocop.js'))
const yarn_outdated_js_1 = __importDefault(require('./plugins/yarn_outdated.js'))
const timer_js_1 = require('./helpers/timer.js')
const spinnies = new spinnies_1.default()
const PLUGINS = {
  rubocop: rubocop_js_1.default,
  eslint: eslint_js_1.default,
  loc: loc_js_1.default,
  jsCircularDependencies: js_circular_dependencies_js_1.default,
  jsUnimported: js_unimported_js_1.default,
  npmOutdated: npm_outdated_js_1.default,
  yarnOutdated: yarn_outdated_js_1.default,
}
const minimatchCache = {}
const matchPattern = (path, patternOrPatterns) => {
  const patterns = Array.isArray(patternOrPatterns) ? patternOrPatterns : [patternOrPatterns]
  return patterns.some((pattern) => {
    const key = `${path}&&&${pattern}`
    if (!(key in minimatchCache)) minimatchCache[key] = (0, minimatch_1.default)(path, pattern)
    return minimatchCache[key]
  })
}
const findFileOccurences = (file, metrics) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const relevantMetrics = metrics.filter((metric) => {
      const pathIncluded = metric.include ? matchPattern(file.path, metric.include) : true
      const pathExcluded = metric.exclude ? matchPattern(file.path, metric.exclude) : false
      return pathIncluded && !pathExcluded
    })
    if (!relevantMetrics.length) return []
    const occurrencesByMetric = {}
    const lines = yield file.readLines()
    lines.forEach((line, lineIndex) => {
      relevantMetrics.forEach((metric) => {
        var _a
        if (!line.match(metric.pattern)) return
        occurrencesByMetric[(_a = metric.name)] || (occurrencesByMetric[_a] = [])
        occurrencesByMetric[metric.name].push({
          path: file.path,
          lineNumber: lineIndex + 1,
        })
      })
    })
    return Object.entries(occurrencesByMetric).flatMap(([metricName, occurrences]) => {
      const groupByFile = metrics.find((metric) => metric.name === metricName).groupByFile
      return groupByFile
        ? (0, lodash_1.default)(occurrences)
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
  })
const matchPatterns = (files, metrics, quiet) => {
  if (!files.length || !metrics.length) return []
  if (!quiet) spinnies.add('patterns', { text: 'Matching patterns...', indent: 2 })
  // Limit number of concurrently opened files to avoid "Error: spawn EBADF"
  const limit = (0, p_limit_1.default)(10)
  const promise = (0, timer_js_1.executeWithTiming)(
    () => Promise.all(files.map((file) => limit(() => findFileOccurences(file, metrics)))),
    'All pattern metrics together'
  )
  if (!quiet) promise.then(() => spinnies.succeed('patterns', { text: 'Matching patterns' }))
  return promise
}
const runEvals = (metrics, codeOwners, quiet) => {
  if (!metrics.length) return []
  if (!quiet) spinnies.add('evals', { text: 'Running eval()...', indent: 2 })
  const promise = Promise.all(
    metrics.map((metric) =>
      __awaiter(void 0, void 0, void 0, function* () {
        if (!quiet) {
          spinnies.add(`metric_${metric.name}`, {
            text: `${metric.name}...`,
            indent: 4,
          })
        }
        const occurrences = yield (0, timer_js_1.executeWithTiming)(
          () =>
            __awaiter(void 0, void 0, void 0, function* () {
              return yield metric.eval({ codeOwners })
            }),
          `Metric '${metric.name}'`
        )
        const result = occurrences.map((occurrence) =>
          Object.assign(Object.assign({}, occurrence), { metricName: metric.name })
        )
        if (!quiet) spinnies.succeed(`metric_${metric.name}`, { text: metric.name })
        return result
      })
    )
  )
  if (!quiet) promise.then(() => spinnies.succeed('evals', { text: 'Running eval()' }))
  return promise
}
const runPlugins = (plugins, quiet) =>
  __awaiter(void 0, void 0, void 0, function* () {
    if (!Object.keys(plugins).length) return []
    if (!quiet) spinnies.add('plugins', { text: 'Running plugins...', indent: 2 })
    const promise = Promise.all(
      Object.entries(plugins).map(([name, options]) =>
        __awaiter(void 0, void 0, void 0, function* () {
          const plugin = PLUGINS[name]
          if (!plugin)
            (0, error_js_1.panic)(`Unsupported '${name}' plugin\nExpected one of: ${Object.keys(PLUGINS).join(', ')}`)
          if (!quiet) spinnies.add(`plugin_${name}`, { text: `${name}...`, indent: 4 })
          const result = (0, timer_js_1.executeWithTiming)(
            () =>
              __awaiter(void 0, void 0, void 0, function* () {
                return yield plugin.run(options)
              }),
            `Plugin '${name}'`
          )
          if (!quiet) spinnies.succeed(`plugin_${name}`, { text: name })
          return result
        })
      )
    )
    if (!quiet) promise.then(() => spinnies.succeed('plugins', { text: 'Running plugin' }))
    return promise
  })
const emptyMetric = (metricName) => ({
  metricName,
  text: 'No occurrences',
  value: 0,
})
exports.emptyMetric = emptyMetric
const withEmptyMetrics = (occurrences, metrics = []) => {
  const occurrencesByMetric = lodash_1.default.groupBy(occurrences, 'metricName')
  const allMetricNames = lodash_1.default.uniq(
    metrics.map((metric) => metric.name).concat(Object.keys(occurrencesByMetric))
  )
  return allMetricNames
    .map((metricName) => occurrencesByMetric[metricName] || [(0, exports.emptyMetric)(metricName)])
    .flat()
}
const findOccurrences = ({ configuration, files, metric, codeOwners, quiet }) =>
  __awaiter(void 0, void 0, void 0, function* () {
    let metrics = configuration.metrics
    if (metric) metrics = metrics.filter(({ name }) => name === metric)
    const [evalMetrics, fileMetrics] = lodash_1.default.partition(metrics, (metric) => metric.eval)
    let plugins = configuration.plugins || {}
    // From ['loc'] to { 'loc': {} } to handle deprecated array configuration for plugins
    if (Array.isArray(plugins))
      plugins = plugins.reduce((acc, value) => Object.assign(Object.assign({}, acc), { [value]: {} }), {})
    const result = yield Promise.all([
      matchPatterns(files, fileMetrics, quiet),
      runEvals(evalMetrics, codeOwners, quiet),
      runPlugins(plugins, quiet),
    ])
    ;(0, timer_js_1.warnsAboutLongRunningTasks)(5000)
    const occurrences = lodash_1.default
      .flattenDeep(result)
      .map(({ text, value, metricName, filePath, lineNumber, url, owners }) => ({
        text,
        value,
        metricName,
        url:
          url !== undefined
            ? url
            : filePath && (0, github_js_1.buildPermalink)(configuration.project_name, filePath, lineNumber),
        owners: owners !== undefined ? owners : filePath && codeOwners.getOwners(filePath),
      }))
    return withEmptyMetrics(occurrences, metrics)
  })
exports.findOccurrences = findOccurrences
