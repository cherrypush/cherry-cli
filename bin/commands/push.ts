import * as git from '../../src/git.js'

import { upload } from '../helpers.js'

import { Command } from 'commander'
import Codeowners from '../../src/codeowners.js'
import { getConfiguration } from '../../src/configuration.js'
import { computeContributions, uploadContributions } from '../../src/contributions.js'
import { panic } from '../../src/error.js'
import { getFiles } from '../../src/files.js'
import { findOccurrences } from '../../src/occurrences.js'

export default function (program: Command) {
  program
    .command('push')
    .option('--api-key <api_key>', 'your cherrypush.com API key')
    .option('--quiet', 'reduce output to a minimum')
    .action(async (options) => {
      const sha = await git.sha()
      const configuration = await getConfiguration()
      const initialBranch = await git.branchName()
      if (!initialBranch) panic('Not on a branch, checkout a branch before pushing metrics.')

      const hasUncommitedChanges = (await git.uncommittedFiles()).length > 0
      if (hasUncommitedChanges) panic('Please commit your changes before running cherry push.')

      const apiKey = options.apiKey || process.env.CHERRY_API_KEY
      if (!apiKey) panic('Please provide an API key with --api-key or CHERRY_API_KEY environment variable')

      try {
        console.log('Computing metrics for current commit...')
        const occurrences = await findOccurrences({
          configuration,
          filePaths: await getFiles(),
          codeOwners: new Codeowners(),
          quiet: options.quiet,
        })

        await upload(apiKey, configuration.project_name, await git.commitDate(sha), occurrences)

        console.log('\nComputing metrics for previous commit...')
        await git.checkout(`${sha}~`)
        const previousOccurrences = await findOccurrences({
          configuration,
          filePaths: await getFiles(),
          codeOwners: new Codeowners(),
          quiet: options.quiet,
        })

        const contributions = computeContributions(occurrences, previousOccurrences)

        if (contributions.length) {
          console.log('\nUploading contributions...')
          await uploadContributions(
            apiKey,
            configuration.project_name,
            await git.authorName(sha),
            await git.authorEmail(sha),
            sha,
            await git.commitDate(sha),
            contributions,
            configuration.repository
          )
        } else console.log('No contribution found, skipping')

        await git.checkout(initialBranch)
        console.log(`Your dashboard is available at https://www.cherrypush.com/user/projects`)
      } catch (error) {
        console.error(error)
        process.exitCode = 1
        await git.checkout(initialBranch)
      }
    })
}
