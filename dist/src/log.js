'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.debug = exports.setVerboseMode = void 0
let verbose = false
const setVerboseMode = (value) => (verbose = value)
exports.setVerboseMode = setVerboseMode
const debug = (...args) => verbose && console.debug('[DEBUG]', ...args)
exports.debug = debug
