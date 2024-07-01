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
const lodash_1 = __importDefault(require('lodash'))
const occurrences_js_1 = require('../occurrences.js')
const sh_js_1 = __importDefault(require('../sh.js'))
const getMetricName = (dir) => {
  if (dir) return `npx unimported files (${dir})`
  return 'npx unimported files'
}
const getCommand = (dir) => {
  if (dir) return `npx unimported ${dir} --show-unused-files`
  return `npx unimported --show-unused-files`
}
const run = ({ dir }) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { stdout } = yield (0, sh_js_1.default)(getCommand(dir), { throwOnError: false })
    const occurrences = lodash_1.default.compact(
      stdout.split('\n').map((line) => {
        const [col1, col2, col3, filepath] = line.split(/\s+/)
        if (!(col1 === '' && typeof parseInt(col2) == 'number' && col3 === '│')) return // remove irrelevant lines
        return {
          text: lodash_1.default.compact([dir, filepath]).join('/'),
          metricName: getMetricName(dir),
        }
      })
    )
    return occurrences.length === 0 ? [(0, occurrences_js_1.emptyMetric)(getMetricName(dir))] : occurrences
  })
exports.default = { run }
