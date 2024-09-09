import Spinnies from 'spinnies'
import _ from 'lodash'
import axios from 'axios'
import { buildRepoURL } from '../src/permalink.js'
import { panic } from '../src/error.js'
import { v4 } from 'uuid'

export const spinnies = new Spinnies()

export const API_BASE_URL = process.env.API_URL ?? 'https://www.cherrypush.com/api'

export const UPLOAD_BATCH_SIZE = 1000

export const countByMetric = (occurrences) =>
  _(occurrences)
    .groupBy('metricName')
    .mapValues((occurrences) =>
      _.sumBy(occurrences, (occurrence) => (_.isNumber(occurrence.value) ? occurrence.value : 1))
    )
    .value()

const handleApiError = async (callback) => {
  try {
    return await callback()
  } catch (error) {
    if (error.response)
      throw new Error(
        `❌ Error while calling cherrypush.com API ${error.response.status}: ${
          error.response.data?.error || error.response.statusText
        }`
      )
    throw error
  }
}

export const buildMetricsPayload = (occurrences) =>
  _(occurrences)
    .groupBy('metricName')
    .mapValues((occurrences, metricName) => ({
      name: metricName,
      occurrences: occurrences.map((o) => _.pick(o, 'text', 'value', 'url', 'owners')),
    }))
    .values()
    .flatten()
    .value()

export const uploadContributions = async (apiKey, projectName, authorName, authorEmail, sha, date, contributions) =>
  handleApiError(() =>
    axios
      .post(
        API_BASE_URL + '/contributions',
        buildContributionsPayload(projectName, authorName, authorEmail, sha, date, contributions),
        { params: { api_key: apiKey } }
      )
      .then(({ data }) => data)
  )

const buildContributionsPayload = (projectName, authorName, authorEmail, sha, date, contributions) => ({
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

export const upload = async (apiKey, projectName, date, occurrences) => {
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
    } catch (error) {
      spinnies.fail('batches', {
        text: `Batch ${index + 1} out of ${occurrencesBatches.length}: ${error.message}`,
      })
    }
  }
}

const buildPushPayload = ({ apiKey, projectName, uuid, date, occurrences }) => ({
  api_key: apiKey,
  project_name: projectName,
  date: date.toISOString(),
  uuid,
  metrics: buildMetricsPayload(occurrences),
})

export const buildSarifPayload = (projectName, branch, sha, occurrences) => {
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

export const buildSonarGenericImportPayload = (occurrences) => ({
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

export const sortObject = (object) => _(object).toPairs().sortBy(0).fromPairs().value()
