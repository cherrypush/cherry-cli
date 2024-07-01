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
exports.getConfiguration =
  exports.workflowExists =
  exports.getConfigurationFile =
  exports.createWorkflowFile =
  exports.createConfigurationFile =
  exports.WORKFLOW_FILE_FULL_PATH =
  exports.CONFIG_FILE_FULL_PATHS =
  exports.WORKFLOW_FILE_LOCAL_PATH =
  exports.CONFIG_FILE_LOCAL_PATHS =
    void 0
const fs_1 = __importDefault(require('fs'))
const path_1 = require('path')
const url_1 = require('url')
const build_and_import_cjs_1 = __importDefault(require('./build-and-import.cjs'))
const git_js_1 = require('./git.js')
exports.CONFIG_FILE_LOCAL_PATHS = ['.cherry.js', '.cherry.cjs', '.cherry.ts']
exports.WORKFLOW_FILE_LOCAL_PATH = '.github/workflows/cherry_push.yml'
exports.CONFIG_FILE_FULL_PATHS = exports.CONFIG_FILE_LOCAL_PATHS.map((filePath) => `${process.cwd()}/${filePath}`)
exports.WORKFLOW_FILE_FULL_PATH = `${process.cwd()}/${exports.WORKFLOW_FILE_LOCAL_PATH}`
const CONFIG_TEMPLATE_PATH =
  (0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url)) + '/templates/.cherry.js.template'
const WORKFLOW_TEMPLATE_PATH =
  (0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url)) + '/templates/.cherry_push.yml.template'
const createConfigurationFile = (projectName) =>
  fs_1.default.writeFileSync(
    exports.CONFIG_FILE_FULL_PATHS[0],
    fs_1.default.readFileSync(CONFIG_TEMPLATE_PATH).toString().replace('PROJECT_NAME', projectName)
  )
exports.createConfigurationFile = createConfigurationFile
const createWorkflowFile = () => {
  fs_1.default.mkdirSync(`${process.cwd()}/.github/workflows`, { recursive: true })
  fs_1.default.writeFileSync(
    exports.WORKFLOW_FILE_FULL_PATH,
    fs_1.default.readFileSync(WORKFLOW_TEMPLATE_PATH).toString()
  )
}
exports.createWorkflowFile = createWorkflowFile
const getConfigurationFile = () => exports.CONFIG_FILE_FULL_PATHS.find((filePath) => fs_1.default.existsSync(filePath))
exports.getConfigurationFile = getConfigurationFile
const workflowExists = () => fs_1.default.existsSync(exports.WORKFLOW_FILE_FULL_PATH)
exports.workflowExists = workflowExists
const getConfiguration = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _a
    const configurationFile = (0, exports.getConfigurationFile)()
    if (!configurationFile) {
      const guessedProjectName = yield (0, git_js_1.guessProjectName)()
      console.log('ℹ️  No .cherry.js file found, using default configuration...')
      return { project_name: guessedProjectName, plugins: ['loc'] }
    }
    const imported = (0, build_and_import_cjs_1.default)(configurationFile)
    // Allow both syntaxes on configuration files:
    // - module.exports = ...
    // - export default ...   => will be wrapped in a { default } after being processed by buildAndImport
    return (_a = imported.default) !== null && _a !== void 0 ? _a : imported
  })
exports.getConfiguration = getConfiguration
