import { Contribution, Occurrence } from './types.js'

import _ from 'lodash'

const toCountByMetricName = (occurrences: Occurrence[]) =>
  _.mapValues(_.groupBy(occurrences, 'metricName'), (occurrences) =>
    _.sum(occurrences.map((occurrence) => occurrence.value || 1))
  )

export const computeContributions = (occurrences: Occurrence[], previousOccurrences: Occurrence[]) => {
  const counts = toCountByMetricName(occurrences)
  const previousCounts = toCountByMetricName(previousOccurrences)

  const metrics = _.uniq(Object.keys(counts).concat(Object.keys(previousCounts)))
  const contributions: Contribution[] = []
  metrics.forEach((metric) => {
    const diff = (counts[metric] || 0) - (previousCounts[metric] || 0)
    if (diff !== 0) contributions.push({ metricName: metric, diff })
  })

  return contributions
}
