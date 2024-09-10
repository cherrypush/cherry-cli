import * as git from '../../src/git.js'

import { API_BASE_URL, upload } from '../helpers.js'
import { substractDays, toISODate } from '../../src/date.js'

import Codeowners from '../../src/codeowners.js'
import { findOccurrences } from '../../src/occurrences.js'
import { getConfiguration } from '../../src/configuration.js'
import { getFiles } from '../../src/files.js'
import { panic } from '../../src/error.js'

// @ts-expect-error TODO: properly type this
export default function (program) {
  program
    .command('backfill')
    .option('--api-key <api_key>', 'your cherrypush.com API key')
    .option('--since <since>', 'the date at which the backfill will start as yyyy-mm-dd (defaults to 90 days ago)')
    .option('--until <until>', 'the date at which the backfill will stop as yyyy-mm-dd (defaults to today)')
    .option('--interval <interval>', 'the number of days between backfills (defaults to 30)')
    .option('--quiet', 'reduce output to a minimum')
    // @ts-expect-error TODO: properly type this
    .action(async (options) => {
      const since = options.since ? new Date(options.since) : substractDays(new Date(), 90)
      const until = options.until ? new Date(options.until) : new Date()
      const interval = options.interval ? parseInt(options.interval) : 30
      // @ts-expect-error TODO: properly type this
      if (isNaN(since)) panic('Invalid since date')
      // @ts-expect-error TODO: properly type this
      if (isNaN(until)) panic('Invalid until date')
      if (since > until) panic('The since date must be before the until date')
      const initialBranch = await git.branchName()
      if (!initialBranch) panic('Not on a branch, checkout a branch before running the backfill.')
      const hasUncommitedChanges = (await git.uncommittedFiles()).length > 0
      if (hasUncommitedChanges) panic('Please commit your changes before running cherry backfill.')

      const configuration = await getConfiguration()
      const apiKey = options.apiKey || process.env.CHERRY_API_KEY
      if (!apiKey) panic('Please provide an API key with --api-key or CHERRY_API_KEY environment variable.')

      let date = until
      let sha = await git.sha()
      try {
        while (date >= since) {
          const committedAt = await git.commitDate(sha)
          console.log(`On day ${toISODate(date)}...`)

          await git.checkout(sha)

          const codeOwners = new Codeowners()
          const occurrences = await findOccurrences({
            configuration,
            filePaths: await getFiles(),
            codeOwners,
            quiet: options.quiet,
          })
          await upload(apiKey, configuration.project_name, committedAt, occurrences)

          date = substractDays(committedAt, interval)
          sha = await git.commitShaAt(date, initialBranch)
          if (!sha) {
            console.log(`no commit found after ${toISODate(date)}, ending backfill`)
            break
          }
          if (committedAt > until || committedAt < since) break
        }
      } catch (error) {
        console.error(error)
        await git.checkout(initialBranch)
        process.exit(1)
      }

      await git.checkout(initialBranch)
      console.log(`Your dashboard is available at ${API_BASE_URL}/user/projects`)
    })
}
