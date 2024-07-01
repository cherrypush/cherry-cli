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
exports.uncommittedFiles =
  exports.branchName =
  exports.checkout =
  exports.commitShaAt =
  exports.commitDate =
  exports.authorEmail =
  exports.authorName =
  exports.getMergeBase =
  exports.getDefaultBranchName =
  exports.sha =
  exports.guessProjectName =
  exports.files =
    void 0
const configuration_js_1 = require('./configuration.js')
const date_js_1 = require('./date.js')
const sh_js_1 = __importDefault(require('./sh.js'))
// eslint-disable-next-line no-useless-escape
const REPO_NAME_REGEX = /([\w\-_\.]+\/[\w\-_\.]+)\.git/g
const git = (cmd) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { stdout } = yield (0, sh_js_1.default)(`git ${cmd}`)
    return stdout.toString().split('\n').filter(Boolean)
  })
const files = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const trackedFiles = yield git('ls-files')
    const untrackedFiles = yield git('ls-files --others --exclude-standard')
    const deletedFiles = yield git('ls-files -d')
    const rejectedFiles = [...deletedFiles, ...configuration_js_1.CONFIG_FILE_LOCAL_PATHS]
    return trackedFiles.concat(untrackedFiles).filter((file) => !rejectedFiles.includes(file))
  })
exports.files = files
const guessProjectName = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const remotes = yield git('remote')
    if (!remotes.length) return ''
    const url = (yield git(`remote get-url ${remotes[0]}`))[0]
    if (!url) return ''
    const matches = Array.from(url.matchAll(REPO_NAME_REGEX))[0]
    return matches[1] || ''
  })
exports.guessProjectName = guessProjectName
const sha = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    return (yield git('rev-parse HEAD')).toString()
  })
exports.sha = sha
const getDefaultBranchName = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    // If we are on a GitHub Action, we can use the GITHUB_BASE_REF env variable
    if (process.env.GITHUB_BASE_REF) return process.env.GITHUB_BASE_REF
    // Otherwise, we need to find the default branch name
    const defaultBranch = (yield git('rev-parse --abbrev-ref origin/HEAD')).toString()
    return defaultBranch.replace('origin/', '').trim()
  })
exports.getDefaultBranchName = getDefaultBranchName
const getMergeBase = (currentBranchName, defaultBranchName) =>
  __awaiter(void 0, void 0, void 0, function* () {
    return (yield git(`merge-base ${currentBranchName} origin/${defaultBranchName}`)).toString().trim()
  })
exports.getMergeBase = getMergeBase
const authorName = (sha) =>
  __awaiter(void 0, void 0, void 0, function* () {
    return (yield git(`show ${sha} --format=%an --no-patch`))[0]
  })
exports.authorName = authorName
const authorEmail = (sha) =>
  __awaiter(void 0, void 0, void 0, function* () {
    return (yield git(`show ${sha} --format=%ae --no-patch`))[0]
  })
exports.authorEmail = authorEmail
const commitDate = (sha) =>
  __awaiter(void 0, void 0, void 0, function* () {
    return new Date((yield git(`show -s --format=%ci ${sha}`))[0])
  })
exports.commitDate = commitDate
const commitShaAt = (date, branch) =>
  __awaiter(void 0, void 0, void 0, function* () {
    return (yield git(`rev-list --reverse --after=${(0, date_js_1.toISODate)(date)} ${branch}`))[0]
  })
exports.commitShaAt = commitShaAt
const checkout = (sha) =>
  __awaiter(void 0, void 0, void 0, function* () {
    return yield git(`checkout ${sha}`)
  })
exports.checkout = checkout
const branchName = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    return (yield git(`branch --show-current`))[0]
  })
exports.branchName = branchName
const uncommittedFiles = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    return yield git('status --porcelain=v1')
  })
exports.uncommittedFiles = uncommittedFiles
