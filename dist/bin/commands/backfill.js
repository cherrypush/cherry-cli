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
const helpers_js_1 = require('../helpers.js')
const codeowners_js_1 = __importDefault(require('../../src/codeowners.js'))
const configuration_js_1 = require('../../src/configuration.js')
const date_js_1 = require('../../src/date.js')
const error_js_1 = require('../../src/error.js')
const files_js_1 = require('../../src/files.js')
const git = __importStar(require('../../src/git.js'))
const occurrences_js_1 = require('../../src/occurrences.js')
function default_1(program) {
  program
    .command('backfill')
    .option('--api-key <api_key>', 'Your cherrypush.com api key')
    .option('--since <since>', 'yyyy-mm-dd | The date at which the backfill will start (defaults to 90 days ago)')
    .option('--until <until>', 'yyyy-mm-dd | The date at which the backfill will stop (defaults to today)')
    .option('--interval <interval>', 'The number of days between backfills (defaults to 30 days)')
    .option('--quiet', 'reduce output to a minimum')
    .action((options) =>
      __awaiter(this, void 0, void 0, function* () {
        const since = options.since ? new Date(options.since) : (0, date_js_1.substractDays)(new Date(), 90)
        const until = options.until ? new Date(options.until) : new Date()
        const interval = options.interval ? parseInt(options.interval) : 30
        if (isNaN(since)) (0, error_js_1.panic)('Invalid since date')
        if (isNaN(until)) (0, error_js_1.panic)('Invalid until date')
        if (since > until) (0, error_js_1.panic)('The since date must be before the until date')
        const initialBranch = yield git.branchName()
        if (!initialBranch) (0, error_js_1.panic)('Not on a branch, checkout a branch before running the backfill.')
        const hasUncommitedChanges = (yield git.uncommittedFiles()).length > 0
        if (hasUncommitedChanges) (0, error_js_1.panic)('Please commit your changes before running cherry backfill.')
        const configuration = yield (0, configuration_js_1.getConfiguration)()
        const apiKey = options.apiKey || process.env.CHERRY_API_KEY
        if (!apiKey)
          (0, error_js_1.panic)('Please provide an API key with --api-key or CHERRY_API_KEY environment variable.')
        let date = until
        let sha = yield git.sha()
        try {
          while (date >= since) {
            const committedAt = yield git.commitDate(sha)
            console.log(`On day ${(0, date_js_1.toISODate)(date)}...`)
            yield git.checkout(sha)
            const files = yield (0, files_js_1.getFiles)()
            const codeOwners = new codeowners_js_1.default()
            const occurrences = yield (0, occurrences_js_1.findOccurrences)({
              configuration,
              files,
              codeOwners,
              quiet: options.quiet,
            })
            yield (0, helpers_js_1.upload)(apiKey, configuration.project_name, committedAt, occurrences)
            date = (0, date_js_1.substractDays)(committedAt, interval)
            sha = yield git.commitShaAt(date, initialBranch)
            if (!sha) {
              console.log(`no commit found after ${(0, date_js_1.toISODate)(date)}, ending backfill`)
              break
            }
            if (committedAt > until || committedAt < since) break
          }
        } catch (error) {
          console.error(error)
          yield git.checkout(initialBranch)
          process.exit(1)
        }
        yield git.checkout(initialBranch)
        console.log(`Your dashboard is available at ${helpers_js_1.API_BASE_URL}/user/projects`)
      })
    )
}
exports.default = default_1
