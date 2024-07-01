'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.computeContributions = void 0
const lodash_1 = __importDefault(require('lodash'))
const toCountByMetricName = (occurrences) =>
  lodash_1.default.mapValues(lodash_1.default.groupBy(occurrences, 'metricName'), (occurrences) =>
    lodash_1.default.sum(occurrences.map((occurrence) => occurrence.value || 1))
  )
const computeContributions = (occurrences, previousOccurrences) => {
  const counts = toCountByMetricName(occurrences)
  const previousCounts = toCountByMetricName(previousOccurrences)
  const metrics = lodash_1.default.uniq(Object.keys(counts).concat(Object.keys(previousCounts)))
  const contributions = []
  metrics.forEach((metric) => {
    const diff = (counts[metric] || 0) - (previousCounts[metric] || 0)
    if (diff !== 0) contributions.push({ metricName: metric, diff })
  })
  return contributions
}
exports.computeContributions = computeContributions
