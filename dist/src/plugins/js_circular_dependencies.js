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
Object.defineProperty(exports, '__esModule', { value: true })
const glob_1 = __importDefault(require('glob'))
const madge_1 = __importDefault(require('madge'))
const occurrences_js_1 = require('../occurrences.js')
const DEFAULT_FILES = '**/*.{js,jsx,ts,tsx}'
const run = ({ include, tsConfig }) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const paths = glob_1.default.sync(include || DEFAULT_FILES, {
      ignore: 'node_modules/**/*',
    })
    const madgeConfig = { tsConfig } // https://github.com/pahen/madge#configuration
    const madgeResult = yield (0, madge_1.default)(paths, madgeConfig)
    const dependencies = madgeResult.circular()
    const occurrences = dependencies.map((files) => ({
      text: files.join(' > '),
      filePath: files[0],
      metricName: 'JS circular dependencies',
    }))
    return occurrences.length === 0 ? [(0, occurrences_js_1.emptyMetric)('JS circular dependencies')] : occurrences
  })
exports.default = { run }
