import _ from 'lodash'
import { buildRepoURL } from '../repository.js'
import { Occurrence, Repository } from '../types.js'

export const buildSarifPayload = (repository: Repository, branch: string, sha: string, occurrences: Occurrence[]) => {
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
            repositoryUri: buildRepoURL(repository),
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
