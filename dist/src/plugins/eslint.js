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
    let files
    try {
      const { stdout } = yield (0, sh_js_1.default)(
        './node_modules/eslint/bin/eslint.js . --format=json --ext .js,.jsx,.ts,.tsx --no-inline-config --ignore-path .gitignore',
        {
          throwOnError: false,
        }
      )
      files = JSON.parse(stdout)
    } catch (error) {
      ;(0, error_js_1.panic)('An error happened while executing eslint\n- Make sure eslint is properly installed')
    }
    return files
      .filter((file) => file.errorCount > 0)
      .flatMap((file) =>
        file.messages.map((message) => ({
          text: `${file.filePath}:${message.line}`,
          filePath: file.filePath,
          metricName: `[eslint] ${message.ruleId}`,
        }))
      )
  })
exports.default = { run }
