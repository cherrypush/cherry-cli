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
const error_js_1 = require('../error.js')
const sh_js_1 = __importDefault(require('../sh.js'))
const run = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { stdout } = yield (0, sh_js_1.default)('bundle exec rubocop --format=json', {
      throwOnError: false,
    })
    let report
    try {
      report = JSON.parse(stdout)
    } catch (error) {
      ;(0, error_js_1.panic)(
        'An error happened while executing rubocop\n- Make sure the `bundle exec rubocop` command works\n- Make sure to `bundle install` if you are using bundler'
      )
    }
    return report.files
      .filter((file) => file.offenses.length)
      .flatMap((file) =>
        file.offenses.map((offense) => ({
          text: `${file.path}:${offense.location.line}`,
          filePath: file.path,
          metricName: `[rubocop] ${offense.cop_name}`,
        }))
      )
  })
exports.default = { run }
