'use strict'
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        var desc = Object.getOwnPropertyDescriptor(m, k)
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k]
            },
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : function (o, v) {
        o['default'] = v
      })
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k)
    __setModuleDefault(result, mod)
    return result
  }
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
const fs_1 = __importDefault(require('fs'))
const lodash_1 = __importDefault(require('lodash'))
const codeowners_js_1 = __importDefault(require('../../src/codeowners.js'))
const configuration_js_1 = require('../../src/configuration.js')
const files_js_1 = require('../../src/files.js')
const occurrences_js_1 = require('../../src/occurrences.js')
const helpers_js_1 = require('../helpers.js')
const git = __importStar(require('../../src/git.js'))
const error_js_1 = require('../../src/error.js')
function default_1(program) {
  program
    .command('diff')
    .requiredOption('--metric <metric>', 'Add a metric', (value, previous) =>
      previous ? [...previous, value] : [value]
    )
    .option('--input-file <input_file>', 'A JSON file containing the metrics to compare with')
    .option('--api-key <api_key>', 'THIS OPTION IS DEPRECATED, DO NOT USE IT')
    .option('--error-if-increase', 'Return an error status code (1) if the metric increased since its last report')
    .option('--quiet', 'reduce output to a minimum')
    .action((options) =>
      __awaiter(this, void 0, void 0, function* () {
        var _a
        const configuration = yield (0, configuration_js_1.getConfiguration)()
        const metrics = options.metric
        const inputFile = options.inputFile
        // TODO: Remove this when the --api-key option is removed
        if (options.apiKey) console.log('WARNING: --api-key is deprecated and will raise an error in the future.')
        let lastMetricValue
        let previousOccurrences
        let metricOccurrences
        const initialBranch = yield git.branchName()
        if (!inputFile && !initialBranch)
          (0, error_js_1.panic)('Not on a branch, checkout a branch before running cherry diff.')
        const hasUncommitedChanges = (yield git.uncommittedFiles()).length > 0
        if (!inputFile && hasUncommitedChanges)
          (0, error_js_1.panic)('Please commit your changes before running cherry diff.')
        // Start by calculating the occurrences for the current branch
        const currentOccurrences = yield (0, occurrences_js_1.findOccurrences)({
          configuration,
          files: yield (0, files_js_1.getFiles)(),
          codeOwners: new codeowners_js_1.default(),
          quiet: options.quiet,
        })
        // TODO: If a file has been provided, then we can skip the merge base logic
        if (!inputFile) {
          const defaultBranchName = yield git.getDefaultBranchName()
          const baseBranchCommit = yield git.getMergeBase(initialBranch, defaultBranchName)
          yield git.checkout(baseBranchCommit)
          previousOccurrences = yield (0, occurrences_js_1.findOccurrences)({
            configuration,
            files: yield (0, files_js_1.getFiles)(),
            codeOwners: new codeowners_js_1.default(),
            quiet: options.quiet,
          })
          yield git.checkout(initialBranch) // Bring user back to initial branch
        }
        // For each metric, compare the current occurrences with the previous ones
        for (const metric of metrics) {
          try {
            console.log('-----------------------------------')
            console.log(`Metric: ${metric}`)
            if (inputFile) {
              const content = fs_1.default.readFileSync(inputFile, 'utf8')
              const metrics = JSON.parse(content)
              metricOccurrences =
                ((_a = metrics.find((m) => m.name === metric)) === null || _a === void 0 ? void 0 : _a.occurrences) ||
                []
              previousOccurrences = metricOccurrences
              lastMetricValue = lodash_1.default.sumBy(metricOccurrences, (occurrence) =>
                lodash_1.default.isNumber(occurrence.value) ? occurrence.value : 1
              )
            } else {
              lastMetricValue = (0, helpers_js_1.countByMetric)(previousOccurrences)[metric] || 0
            }
            if (!Number.isInteger(lastMetricValue)) {
              console.log('No last value found for this metric, aborting.')
              process.exit(1)
            }
            console.log(`Last value: ${lastMetricValue}`)
          } catch (e) {
            console.error(e)
            process.exit(1)
          }
          const currentMetricValue = (0, helpers_js_1.countByMetric)(currentOccurrences)[metric] || 0
          console.log(`Current value: ${currentMetricValue}`)
          const diff = currentMetricValue - lastMetricValue
          console.log(`Difference: ${diff}`)
          // Log added occurrences if any
          if (diff > 0) {
            console.log('Added occurrences:')
            const currentMetricOccurrences = currentOccurrences.filter((o) => o.metricName === metric)
            const currentMetricOccurrencesTexts = currentMetricOccurrences.map((o) => o.text)
            const previousOccurrencesTexts = previousOccurrences.map((occurrence) => occurrence.text)
            console.log(currentMetricOccurrencesTexts.filter((x) => !previousOccurrencesTexts.includes(x)))
          }
          // Return an error code if the metric increased
          if (diff > 0 && options.errorIfIncrease) process.exit(1)
        }
      })
    )
}
exports.default = default_1
