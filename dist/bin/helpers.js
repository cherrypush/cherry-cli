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
var _a
Object.defineProperty(exports, '__esModule', { value: true })
exports.sortObject =
  exports.buildSonarGenericImportPayload =
  exports.buildSarifPayload =
  exports.upload =
  exports.uploadContributions =
  exports.buildMetricsPayload =
  exports.countByMetric =
  exports.packageJson =
  exports.UPLOAD_BATCH_SIZE =
  exports.API_BASE_URL =
  exports.spinnies =
    void 0
const axios_1 = __importDefault(require('axios'))
const fs_1 = __importDefault(require('fs'))
const lodash_1 = __importDefault(require('lodash'))
const error_js_1 = require('../src/error.js')
const spinnies_1 = __importDefault(require('spinnies'))
const uuid_1 = require('uuid')
const github_js_1 = require('../src/github.js')
exports.spinnies = new spinnies_1.default()
exports.API_BASE_URL = (_a = process.env.API_URL) !== null && _a !== void 0 ? _a : 'https://www.cherrypush.com/api'
exports.UPLOAD_BATCH_SIZE = 1000
exports.packageJson = JSON.parse(fs_1.default.readFileSync(new URL('../package.json', import.meta.url)))
const countByMetric = (occurrences) =>
  (0, lodash_1.default)(occurrences)
    .groupBy('metricName')
    .mapValues((occurrences) =>
      lodash_1.default.sumBy(occurrences, (occurrence) =>
        lodash_1.default.isNumber(occurrence.value) ? occurrence.value : 1
      )
    )
    .value()
exports.countByMetric = countByMetric
const handleApiError = (callback) =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _b
    try {
      return yield callback()
    } catch (error) {
      if (error.response)
        throw new Error(
          `❌ Error while calling cherrypush.com API ${error.response.status}: ${((_b = error.response.data) === null || _b === void 0 ? void 0 : _b.error) || error.response.statusText}`
        )
      throw error
    }
  })
const buildMetricsPayload = (occurrences) =>
  (0, lodash_1.default)(occurrences)
    .groupBy('metricName')
    .mapValues((occurrences, metricName) => ({
      name: metricName,
      occurrences: occurrences.map((o) => lodash_1.default.pick(o, 'text', 'value', 'url', 'owners')),
    }))
    .values()
    .flatten()
    .value()
exports.buildMetricsPayload = buildMetricsPayload
const uploadContributions = (apiKey, projectName, authorName, authorEmail, sha, date, contributions) =>
  __awaiter(void 0, void 0, void 0, function* () {
    return handleApiError(() =>
      axios_1.default
        .post(
          exports.API_BASE_URL + '/contributions',
          buildContributionsPayload(projectName, authorName, authorEmail, sha, date, contributions),
          { params: { api_key: apiKey } }
        )
        .then(({ data }) => data)
    )
  })
exports.uploadContributions = uploadContributions
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
const upload = (apiKey, projectName, date, occurrences) =>
  __awaiter(void 0, void 0, void 0, function* () {
    if (!projectName)
      (0, error_js_1.panic)('specify a project_name in your cherry.js configuration file before pushing metrics')
    const uuid = yield (0, uuid_1.v4)()
    const occurrencesBatches = lodash_1.default.chunk(occurrences, exports.UPLOAD_BATCH_SIZE)
    console.log('')
    console.log(`Uploading ${occurrences.length} occurrences in ${occurrencesBatches.length} batches:`)
    for (const [index, occurrencesBatch] of occurrencesBatches.entries()) {
      exports.spinnies.add('batches', {
        text: `Batch ${index + 1} out of ${occurrencesBatches.length}`,
        indent: 2,
      })
      try {
        yield handleApiError(() =>
          axios_1.default
            .post(
              exports.API_BASE_URL + '/push',
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
              exports.spinnies.succeed('batches', {
                text: `Batch ${index + 1} out of ${occurrencesBatches.length}`,
              })
            )
        )
      } catch (error) {
        exports.spinnies.fail('batches', {
          text: `Batch ${index + 1} out of ${occurrencesBatches.length}: ${error.message}`,
        })
      }
    }
  })
exports.upload = upload
const buildPushPayload = ({ apiKey, projectName, uuid, date, occurrences }) => ({
  api_key: apiKey,
  project_name: projectName,
  date: date.toISOString(),
  uuid,
  metrics: (0, exports.buildMetricsPayload)(occurrences),
})
const buildSarifPayload = (projectName, branch, sha, occurrences) => {
  const rules = (0, lodash_1.default)(occurrences)
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
            repositoryUri: (0, github_js_1.buildRepoURL)(projectName),
            revisionId: sha,
            branch,
          },
        ],
        tool: {
          driver: {
            name: 'cherry',
            version: exports.packageJson.version,
            informationUri: 'https://github.com/cherrypush/cherrypush.com',
            rules,
          },
        },
        results,
      },
    ],
  }
}
exports.buildSarifPayload = buildSarifPayload
const buildSonarGenericImportPayload = (occurrences) => ({
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
exports.buildSonarGenericImportPayload = buildSonarGenericImportPayload
const sortObject = (object) => (0, lodash_1.default)(object).toPairs().sortBy(0).fromPairs().value()
exports.sortObject = sortObject
