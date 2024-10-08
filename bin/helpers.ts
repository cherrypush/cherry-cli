import { EvalMetric, Metric, Occurrence } from '../src/types.js'

import axios from 'axios'
import { randomUUID } from 'crypto'
import _ from 'lodash'
import Spinnies from 'spinnies'
import { panic } from '../src/error.js'

export const spinnies = new Spinnies()

export const API_BASE_URL = process.env.API_URL ?? 'https://www.cherrypush.com/api'

export const UPLOAD_BATCH_SIZE = 1000

export function allowMultipleValues(value: string, previous: string[]) {
  return previous ? [...previous, value] : [value]
}

export const countByMetric = (occurrences: Occurrence[]) =>
  _(occurrences)
    .groupBy('metricName')
    .mapValues((occurrences) =>
      _.sumBy(occurrences, (occurrence) => (_.isNumber(occurrence.value) ? occurrence.value : 1))
    )
    .value()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleApiError = async (callback: any) => {
  try {
    return await callback()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response)
      throw new Error(
        `❌ Error while calling cherrypush.com API ${error.response.status}: ${
          error.response.data?.error || error.response.statusText
        }`
      )
    throw error
  }
}

export const buildMetricsPayload = (occurrences: Occurrence[]) =>
  _(occurrences)
    .groupBy('metricName')
    .mapValues((occurrences, metricName) => ({
      name: metricName,
      occurrences: occurrences.map((o) => _.pick(o, 'text', 'value', 'url', 'owners')),
    }))
    .values()
    .flatten()
    .value()

export const upload = async (apiKey: string, projectName: string, date: Date, occurrences: Occurrence[]) => {
  if (!projectName) panic('Specify a project_name in your cherry.js configuration file before pushing metrics')

  const uuid = randomUUID()
  const occurrencesBatches = _.chunk(occurrences, UPLOAD_BATCH_SIZE)

  console.log('')
  console.log(`Uploading ${occurrences.length} occurrences in ${occurrencesBatches.length} batches:`)
  for (const [index, occurrencesBatch] of occurrencesBatches.entries()) {
    spinnies.add('batches', {
      text: `Batch ${index + 1} out of ${occurrencesBatches.length}`,
      indent: 2,
    })

    try {
      await handleApiError(() =>
        axios
          .post(
            API_BASE_URL + '/push',
            buildPushPayload({
              apiKey,
              projectName,
              uuid,
              date,
              occurrences: occurrencesBatch,
            })
          )
          .then(({ data }) => data)
          .then(() =>
            spinnies.succeed('batches', {
              text: `Batch ${index + 1} out of ${occurrencesBatches.length}`,
            })
          )
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      spinnies.fail('batches', {
        text: `Batch ${index + 1} out of ${occurrencesBatches.length}: ${error.message}`,
      })
    }
  }
}

const buildPushPayload = ({
  apiKey,
  projectName,
  uuid,
  date,
  occurrences,
}: {
  apiKey: string
  projectName: string
  uuid: string
  date: Date
  occurrences: Occurrence[]
}) => ({
  api_key: apiKey,
  project_name: projectName,
  date: date.toISOString(),
  uuid,
  metrics: buildMetricsPayload(occurrences),
})

export const sortObject = (object: object) => _(object).toPairs().sortBy(0).fromPairs().value()

export function isEvalMetric(metric: Metric): metric is EvalMetric {
  return 'eval' in metric
}
