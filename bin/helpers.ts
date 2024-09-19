import { Contribution, EvalMetric, Metric, Occurrence } from '../src/types.js'

import Spinnies from 'spinnies'
import _ from 'lodash'
import axios from 'axios'
import { buildRepoURL } from '../src/permalink.js'
import { panic } from '../src/error.js'
import { v4 } from 'uuid'

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
const handleApiError = async (callback: any) => {
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

export const uploadContributions = async (
  apiKey: string,
  projectName: string,
  authorName: string,
  authorEmail: string,
  sha: string,
  date: Date,
  contributions: Contribution[]
) =>
  handleApiError(() =>
    axios
      .post(
        API_BASE_URL + '/contributions',
        buildContributionsPayload(projectName, authorName, authorEmail, sha, date, contributions),
        { params: { api_key: apiKey } }
      )
      .then(({ data }) => data)
  )

const buildContributionsPayload = (
  projectName: string,
  authorName: string,
  authorEmail: string,
  sha: string,
  date: Date,
  contributions: Contribution[]
) => ({
  project_name: projectName,
  author_name: authorName,
  author_email: authorEmail,
  commit_sha: sha,
  commit_date: date.toISOString(),
  contributions: contributions.map((contribution) => ({
    metric_name: contribution.metricName,
    diff: contribution.diff,
  })),
})

export const upload = async (apiKey: string, projectName: string, date: Date, occurrences: Occurrence[]) => {
  if (!projectName) panic('specify a project_name in your cherry.js configuration file before pushing metrics')

  const uuid = await v4()
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

export const buildSarifPayload = (projectName: string, branch: string, sha: string, occurrences: Occurrence[]) => {
  const rules = _(occurrences)
    .groupBy('metricName')
    .map((occurrences) => ({
      id: occurrences[0].metricName,
    }))

  const results = occurrences.map((occurrence) => ({
    ruleId: occurrence.metricName,
    level: 'none',
    message: { text: `${occurrence.metricName} at ${occurrence.text}` },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: occurrence.text.split(':')[0],
          },
          region: {
            startLine: parseInt(occurrence.text.split(':')[1]) || 1,
          },
        },
      },
    ],
  }))

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        versionControlProvenance: [
          {
            repositoryUri: buildRepoURL(projectName),
            revisionId: sha,
            branch,
          },
        ],
        tool: {
          driver: {
            name: 'cherry',
            version: process.env.npm_package_version,
            informationUri: 'https://github.com/cherrypush/cherrypush.com',
            rules,
          },
        },
        results,
      },
    ],
  }
}

export const buildSonarGenericImportPayload = (occurrences: Occurrence[]) => ({
  issues: occurrences.map((occurrence) => ({
    engineId: 'cherry',
    ruleId: occurrence.metricName,
    type: 'CODE_SMELL',
    severity: 'INFO',
    primaryLocation: {
      message: `${occurrence.metricName} at ${occurrence.text}`,
      filePath: occurrence.text.split(':')[0],
      textRange: {
        startLine: parseInt(occurrence.text.split(':')[1]) || 1,
      },
    },
  })),
})

export const sortObject = (object: object) => _(object).toPairs().sortBy(0).fromPairs().value()

export function isEvalMetric(metric: Metric): metric is EvalMetric {
  return 'eval' in metric
}
