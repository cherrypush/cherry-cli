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
const BASE_COMMAND = 'npm outdated --json'
const getCommands = (prefix) => {
  if (!prefix) return [{ prefix: '', command: BASE_COMMAND }]
  if (Array.isArray(prefix))
    return prefix.map((p) => ({
      prefix: p,
      command: `${BASE_COMMAND} --prefix ${p}`,
    }))
  if (typeof prefix === 'string') return [{ prefix, command: `${BASE_COMMAND} --prefix ${prefix}` }]
  ;(0, error_js_1.panic)(`Invalid prefix: ${prefix}`)
}
const getMetricName = (prefix) => {
  const packageJsonPath = lodash_1.default.compact([prefix, 'package.json']).join('/')
  return `npm outdated dependencies (${packageJsonPath})`
}
const run = ({ prefix }) =>
  __awaiter(void 0, void 0, void 0, function* () {
    let outdatedDependencies = []
    const commands = getCommands(prefix)
    yield Promise.all(
      commands.map((command) =>
        __awaiter(void 0, void 0, void 0, function* () {
          try {
            const { stdout } = yield (0, sh_js_1.default)(command.command, { throwOnError: false })
            const response = JSON.parse(stdout)
            if (response.error) (0, error_js_1.panic)(`${response.error.summary}\n${response.error.detail}`)
            if (Object.keys(response).length === 0) {
              outdatedDependencies.push((0, occurrences_js_1.emptyMetric)(getMetricName(command.prefix)))
            } else {
              Object.keys(response).forEach((dependencyName) =>
                outdatedDependencies.push({
                  name: dependencyName,
                  current: response[dependencyName].current,
                  latest: response[dependencyName].latest,
                  location: response[dependencyName].location,
                  prefix: command.prefix,
                })
              )
            }
          } catch (error) {
            ;(0, error_js_1.panic)(
              `An error happened while executing npm: ${error}\n- Make sure the 'npm outdated' command works`
            )
          }
        })
      )
    )
    return outdatedDependencies.map((dependency) => ({
      text: `${dependency.name} (${dependency.current} -> ${dependency.latest})`,
      metricName: getMetricName(dependency.prefix),
    }))
  })
exports.default = { run }
