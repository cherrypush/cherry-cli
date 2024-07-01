'use strict'
var __classPrivateFieldGet =
  (this && this.__classPrivateFieldGet) ||
  function (receiver, state, kind, f) {
    if (kind === 'a' && !f) throw new TypeError('Private accessor was defined without a getter')
    if (typeof state === 'function' ? receiver !== state || !f : !state.has(receiver))
      throw new TypeError('Cannot read private member from an object whose class did not declare it')
    return kind === 'm' ? f : kind === 'a' ? f.call(receiver) : f ? f.value : state.get(receiver)
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
var _Codeowners_instances, _Codeowners_globFiles
Object.defineProperty(exports, '__esModule', { value: true })
const find_up_1 = require('find-up')
const fs_1 = __importDefault(require('fs'))
const glob_1 = __importDefault(require('glob'))
const intersection_js_1 = __importDefault(require('lodash/intersection.js'))
const uniq_js_1 = __importDefault(require('lodash/uniq.js'))
const path_1 = __importDefault(require('path'))
const true_case_path_1 = __importDefault(require('true-case-path'))
const file_js_1 = require('./file.js')
const { trueCasePathSync } = true_case_path_1.default
class Codeowners {
  constructor() {
    _Codeowners_instances.add(this)
    this.ownersByFile = {}
    this.init()
  }
  init() {
    const fileName = 'CODEOWNERS'
    const codeownersPath = (0, find_up_1.findUpSync)(
      [`.github/${fileName}`, `.gitlab/${fileName}`, `docs/${fileName}`, `${fileName}`],
      { cwd: process.cwd() }
    )
    if (!codeownersPath) return
    const codeownersFilePath = trueCasePathSync(codeownersPath)
    let codeownersDirectory = path_1.default.dirname(codeownersFilePath)
    // We might have found a bare codeowners file or one inside the three supported subdirectories.
    // In the latter case the project root is up another level.
    if (codeownersDirectory.match(/\/(.github|.gitlab|docs)$/i))
      codeownersDirectory = path_1.default.dirname(codeownersDirectory)
    const codeownersFile = path_1.default.basename(codeownersFilePath)
    if (codeownersFile !== fileName)
      throw new Error(`Found a ${fileName} file but it was lower-cased: ${codeownersFilePath}`)
    if ((0, file_js_1.isDirectory)(codeownersFilePath))
      throw new Error(`Found a ${fileName} but it's a directory: ${codeownersFilePath}`)
    const lines = fs_1.default
      .readFileSync(codeownersFilePath)
      .toString()
      .split(/\r\n|\r|\n/)
      .filter(Boolean)
      .map((line) => line.trim())
    for (const line of lines) {
      if (line.startsWith('#')) continue
      const [codeownersPath, ...owners] = line.split(/\s+/)
      for (const file of __classPrivateFieldGet(this, _Codeowners_instances, 'm', _Codeowners_globFiles).call(
        this,
        codeownersPath
      ))
        this.ownersByFile[file] = (0, uniq_js_1.default)(owners)
    }
  }
  getFiles(owners) {
    return (0, uniq_js_1.default)(
      Object.entries(this.ownersByFile)
        .filter(([, fileOwners]) => (0, intersection_js_1.default)(owners, fileOwners).length > 0)
        .map(([file]) => file)
        .flat()
    )
  }
  getOwners(file) {
    return this.ownersByFile[file] || []
  }
}
;(_Codeowners_instances = new WeakSet()),
  (_Codeowners_globFiles = function _Codeowners_globFiles(codeownersPath) {
    if (codeownersPath.includes('*')) return glob_1.default.sync(codeownersPath, { nodir: true })
    if ((0, file_js_1.isDirectory)(codeownersPath))
      return glob_1.default.sync(path_1.default.join(codeownersPath, '**/*'), { nodir: true })
    return [codeownersPath]
  })
exports.default = Codeowners
