#! /usr/bin/env node

import backfillCommand from './commands/backfill.js'
import diffCommand from './commands/diff.js'
import dotenv from 'dotenv'
import initCommand from './commands/init.js'
import { program } from 'commander'
import pushCommand from './commands/push.js'
import runCommand from './commands/run.js'
import { setVerboseMode } from '../src/log.js'

// Do not load environment variables on tests
if (process.env.NODE_ENV !== 'test') dotenv.config()

initCommand(program)
diffCommand(program)
runCommand(program)
backfillCommand(program)
pushCommand(program)

program
  .option('-v, --verbose', 'Enable verbose mode')
  .hook('preAction', (command) => command.opts().verbose && setVerboseMode(true))
  .parse(process.argv)
