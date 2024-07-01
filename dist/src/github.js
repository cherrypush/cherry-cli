'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.buildPermalink = exports.buildRepoURL = void 0
const buildRepoURL = (projectName) => `https://github.com/${projectName}`
exports.buildRepoURL = buildRepoURL
const buildPermalink = (projectName, path, lineNumber) =>
  `${(0, exports.buildRepoURL)(projectName)}/blob/HEAD/${path}${lineNumber ? `#L${lineNumber}` : ''}`
exports.buildPermalink = buildPermalink
