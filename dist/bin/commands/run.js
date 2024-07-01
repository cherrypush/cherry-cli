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
const error_js_1 = require('../../src/error.js')
const files_js_1 = require('../../src/files.js')
const git = __importStar(require('../../src/git.js'))
const occurrences_js_1 = require('../../src/occurrences.js')
const helpers_js_1 = require('../helpers.js')
function default_1(program) {
  program
    .command('run')
    .option('--owner <owner>', 'only consider given owner code')
    .option('--metric <metric>', 'only consider given metric')
    .option('-o, --output <output>', 'export stats into a local file')
    .option('-f, --format <format>', 'export format (json, sarif, sonar). default: json')
    .option('--quiet', 'reduce output to a minimum')
    .action((options) =>
      __awaiter(this, void 0, void 0, function* () {
        const configuration = yield (0, configuration_js_1.getConfiguration)()
        const codeOwners = new codeowners_js_1.default()
        const owners = options.owners ? options.owners.split(',') : null
        const files = options.owner
          ? yield (0, files_js_1.getFiles)(options.owner.split(','), codeOwners)
          : yield (0, files_js_1.getFiles)()
        const quiet = options.quiet
        const occurrences = yield (0, occurrences_js_1.findOccurrences)({
          configuration,
          files,
          metric: options.metric,
          codeOwners,
          quiet,
        })
        if (options.owner || options.metric) {
          let displayedOccurrences = occurrences
          if (owners)
            displayedOccurrences = displayedOccurrences.filter(
              (o) => lodash_1.default.intersection(o.owners, owners).length
            )
          if (options.metric) displayedOccurrences = displayedOccurrences.filter((o) => o.metricName === options.metric)
          displayedOccurrences.forEach((occurrence) => console.log(`👉 ${occurrence.text}`))
          console.log('Total occurrences:', displayedOccurrences.length)
        } else console.table((0, helpers_js_1.sortObject)((0, helpers_js_1.countByMetric)(occurrences)))
        if (options.output) {
          const filepath = process.cwd() + '/' + options.output
          const format = options.format || 'json'
          let content
          if (format === 'json') {
            const metrics = (0, helpers_js_1.buildMetricsPayload)(occurrences)
            content = JSON.stringify(metrics, null, 2)
          } else if (format === 'sarif') {
            const branch = yield git.branchName()
            const sha = yield git.sha()
            const sarif = (0, helpers_js_1.buildSarifPayload)(configuration.project_name, branch, sha, occurrences)
            content = JSON.stringify(sarif, null, 2)
          } else if (format === 'sonar') {
            const sonar = (0, helpers_js_1.buildSonarGenericImportPayload)(occurrences)
            content = JSON.stringify(sonar, null, 2)
          }
          fs_1.default.writeFile(filepath, content, 'utf8', function (err) {
            if (err) (0, error_js_1.panic)(err)
            console.log(`File has been saved as ${filepath}`)
          })
        }
      })
    )
}
exports.default = default_1
