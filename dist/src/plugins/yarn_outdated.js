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
const error_js_1 = require('../error.js')
const occurrences_js_1 = require('../occurrences.js')
const sh_js_1 = __importDefault(require('../sh.js'))
const getMetricName = (cwd) => {
  const packageJsonPath = lodash_1.default.compact([cwd, 'package.json']).join('/')
  return `yarn outdated dependencies (${packageJsonPath})`
}
const run = ({ cwd }) =>
  __awaiter(void 0, void 0, void 0, function* () {
    let outdatedDependencies = []
    let output = ''
    const command = cwd ? `yarn outdated --cwd ${cwd} --no-progress` : 'yarn outdated'
    try {
      const { stdout, stderr } = yield (0, sh_js_1.default)(command, { throwOnError: false })
      output = stdout
      if (stderr) throw stderr
    } catch (error) {
      ;(0, error_js_1.panic)(error)
    }
    output.split('\n').forEach((line) => {
      const [name, current, wanted, latest, type, url] = line.split(/\s+/)
      if (name === 'Package') return // remove header
      if (!name || !current || !wanted || !latest || !type || !url) return // remove irrelevant lines
      outdatedDependencies.push({ name, current, wanted, latest, type, url })
    })
    const occurrences = outdatedDependencies.map((dependency) => ({
      text: `${dependency.name} (${dependency.current} -> ${dependency.latest})`,
      metricName: getMetricName(cwd),
    }))
    return occurrences.length === 0 ? [(0, occurrences_js_1.emptyMetric)(getMetricName(cwd))] : occurrences
  })
exports.default = { run }
