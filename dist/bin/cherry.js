#! /usr/bin/env node
'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const commander_1 = require('commander')
const dotenv_1 = __importDefault(require('dotenv'))
const log_js_1 = require('../src/log.js')
const diff_js_1 = __importDefault(require('./commands/diff.js'))
const run_js_1 = __importDefault(require('./commands/run.js'))
const backfill_js_1 = __importDefault(require('./commands/backfill.js'))
const push_js_1 = __importDefault(require('./commands/push.js'))
const init_js_1 = __importDefault(require('./commands/init.js'))
// Do not load environment variables on tests
if (process.env.NODE_ENV !== 'test') dotenv_1.default.config()
;(0, init_js_1.default)(commander_1.program)
;(0, diff_js_1.default)(commander_1.program)
;(0, run_js_1.default)(commander_1.program)
;(0, backfill_js_1.default)(commander_1.program)
;(0, push_js_1.default)(commander_1.program)
commander_1.program
  .option('-v, --verbose', 'Enable verbose mode')
  .hook('preAction', (command) => command.opts().verbose && (0, log_js_1.setVerboseMode)(true))
  .parse(process.argv)
