#! /usr/bin/env node

import { program } from 'commander'
import dotenv from 'dotenv'
import { setVerboseMode } from '../src/log.js'
import diffCommand from './commands/diff.js'
import runCommand from './commands/run.js'
import backfillCommand from './commands/backfill.js'
import pushCommand from './commands/push.js'
import initCommand from './commands/init.js'

// Do not load environment variables on tests
if (process.env.NODE_ENV !== 'test') dotenv.config()

initCommand(program)
diffCommand(program)
runCommand(program)
backfillCommand(program)
pushCommand(program)

program
  .option('-v, --verbose', 'Enable verbose mode')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().verbose) setVerboseMode(true)
  })
  .parse(process.argv)
