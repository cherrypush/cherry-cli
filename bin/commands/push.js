import { computeContributions } from '../../src/contributions.js'
import { upload, uploadContributions } from '../helpers.js'
import Codeowners from '../../src/codeowners.js'
import { getConfiguration } from '../../src/configuration.js'
import { panic } from '../../src/error.js'
import { getFiles } from '../../src/files.js'
import * as git from '../../src/git.js'
import { findOccurrences } from '../../src/occurrences.js'

export default function (program) {
  program
    .command('push')
    .option('--api-key <api_key>', 'Your cherrypush.com api key')
    .option('--quiet', 'reduce output to a minimum')
    .action(async (options) => {
      const configuration = await getConfiguration()
      const initialBranch = await git.branchName()
      if (!initialBranch) panic('Not on a branch, checkout a branch before pushing metrics.')
      const sha = await git.sha()

      const apiKey = options.apiKey || process.env.CHERRY_API_KEY
      if (!apiKey) panic('Please provide an API key with --api-key or CHERRY_API_KEY environment variable')

      let error
      try {
        console.log('Computing metrics for current commit...')
        const occurrences = await findOccurrences({
          configuration,
          files: await getFiles(),
          codeOwners: new Codeowners(),
          quiet: options.quiet,
        })

        await upload(apiKey, configuration.project_name, await git.commitDate(sha), occurrences)

        console.log('')
        console.log('Computing metrics for previous commit...')
        await git.checkout(`${sha}~`)
        const previousOccurrences = await findOccurrences({
          configuration,
          files: await getFiles(),
          codeOwners: new Codeowners(),
          quiet: options.quiet,
        })

        const contributions = computeContributions(occurrences, previousOccurrences)

        if (contributions.length) {
          console.log(`  Uploading contributions...`)
          await uploadContributions(
            apiKey,
            configuration.project_name,
            await git.authorName(sha),
            await git.authorEmail(sha),
            sha,
            await git.commitDate(sha),
            contributions
          )
        } else console.log('No contribution found, skipping')
      } catch (exception) {
        error = exception
      } finally {
        git.checkout(initialBranch)
      }
      if (error) {
        console.error(error)
        process.exit(1)
      }

      console.log(`Your dashboard is available at https://www.cherrypush.com/user/projects`)
    })
}
