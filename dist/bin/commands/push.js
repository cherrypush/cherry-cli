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
const contributions_js_1 = require('../../src/contributions.js')
const helpers_js_1 = require('../helpers.js')
const codeowners_js_1 = __importDefault(require('../../src/codeowners.js'))
const configuration_js_1 = require('../../src/configuration.js')
const error_js_1 = require('../../src/error.js')
const files_js_1 = require('../../src/files.js')
const git = __importStar(require('../../src/git.js'))
const occurrences_js_1 = require('../../src/occurrences.js')
function default_1(program) {
  program
    .command('push')
    .option('--api-key <api_key>', 'Your cherrypush.com api key')
    .option('--quiet', 'reduce output to a minimum')
    .action((options) =>
      __awaiter(this, void 0, void 0, function* () {
        const configuration = yield (0, configuration_js_1.getConfiguration)()
        const initialBranch = yield git.branchName()
        if (!initialBranch) (0, error_js_1.panic)('Not on a branch, checkout a branch before pushing metrics.')
        const sha = yield git.sha()
        const apiKey = options.apiKey || process.env.CHERRY_API_KEY
        if (!apiKey)
          (0, error_js_1.panic)('Please provide an API key with --api-key or CHERRY_API_KEY environment variable')
        let error
        try {
          console.log('Computing metrics for current commit...')
          const occurrences = yield (0, occurrences_js_1.findOccurrences)({
            configuration,
            files: yield (0, files_js_1.getFiles)(),
            codeOwners: new codeowners_js_1.default(),
            quiet: options.quiet,
          })
          yield (0, helpers_js_1.upload)(apiKey, configuration.project_name, yield git.commitDate(sha), occurrences)
          console.log('')
          console.log('Computing metrics for previous commit...')
          yield git.checkout(`${sha}~`)
          const previousOccurrences = yield (0, occurrences_js_1.findOccurrences)({
            configuration,
            files: yield (0, files_js_1.getFiles)(),
            codeOwners: new codeowners_js_1.default(),
            quiet: options.quiet,
          })
          const contributions = (0, contributions_js_1.computeContributions)(occurrences, previousOccurrences)
          if (contributions.length) {
            console.log(`  Uploading contributions...`)
            yield (0, helpers_js_1.uploadContributions)(
              apiKey,
              configuration.project_name,
              yield git.authorName(sha),
              yield git.authorEmail(sha),
              sha,
              yield git.commitDate(sha),
              contributions
            )
          } else console.log('No contribution found, skipping')
        } catch (exception) {
          error = exception
        } finally {
          git.checkout(initialBranch)
        }
        if (error) {
          console.error(error)
          process.exit(1)
        }
        console.log(`Your dashboard is available at https://www.cherrypush.com/user/projects`)
      })
    )
}
exports.default = default_1
