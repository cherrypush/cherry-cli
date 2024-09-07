import * as git from '../../src/git.js'

import Codeowners from '../../src/codeowners.js'
import _ from 'lodash'
import { allowMultipleValues } from './run.js'
import { countByMetric } from '../helpers.js'
import { findOccurrences } from '../../src/occurrences.js'
import fs from 'fs'
import { getConfiguration } from '../../src/configuration.js'
import { getFiles } from '../../src/files.js'
import { panic } from '../../src/error.js'

export default function (program) {
  program
    .command('diff')
    .requiredOption('--metric <metric>', 'will only consider provided metrics', allowMultipleValues)
    .option('--input-file <input_file>', 'A JSON file containing the metrics to compare with')
    .option('--error-if-increase', 'Return an error status code (1) if the metric increased since its last report')
    .option('--quiet', 'reduce output to a minimum')
    .action(async (options) => {
      const configuration = await getConfiguration()
      const metricNames = options.metric
      const inputFile = options.inputFile

      let lastMetricValue
      let previousOccurrences
      let metricOccurrences

      const initialBranch = await git.branchName()
      if (!inputFile && !initialBranch) panic('Not on a branch, checkout a branch before running cherry diff.')

      const uncommittedFiles = await git.uncommittedFiles()
      const hasUncommitedChanges = uncommittedFiles.length > 0
      if (!inputFile && hasUncommitedChanges)
        panic(`Please commit your changes before running cherry diff: ${uncommittedFiles.join(', ')}`)

      // Start by calculating the occurrences for the current branch
      const currentOccurrences = await findOccurrences({
        configuration,
        files: await getFiles(),
        metricNames,
        codeOwners: new Codeowners(),
        quiet: options.quiet,
      })

      // TODO: If a file has been provided, then we can skip the merge base logic
      if (!inputFile) {
        // Checkout the base branch to calculate its occurrences
        const defaultBranchName = await git.getDefaultBranchName()
        const baseBranchCommit = await git.getMergeBase(initialBranch, defaultBranchName)
        await git.checkout(baseBranchCommit)
        previousOccurrences = await findOccurrences({
          configuration,
          files: await getFiles(),
          metricNames,
          codeOwners: new Codeowners(),
          quiet: options.quiet,
        })
        // Bring user back to initial branch
        await git.checkout(initialBranch)
      }

      // For each metric, compare the current occurrences with the previous ones
      for (const metricName of metricNames) {
        try {
          console.log('-----------------------------------')
          console.log(`Metric: ${metricName}`)

          if (inputFile) {
            const content = fs.readFileSync(inputFile, 'utf8')
            const metrics = JSON.parse(content)
            metricOccurrences = metrics.find((m) => m.name === metricName)?.occurrences || []
            previousOccurrences = metricOccurrences
            lastMetricValue = _.sumBy(metricOccurrences, (occurrence) =>
              _.isNumber(occurrence.value) ? occurrence.value : 1
            )
          } else {
            lastMetricValue = countByMetric(previousOccurrences)[metricName] || 0
          }

          if (!Number.isInteger(lastMetricValue)) {
            console.log('No last value found for this metric, aborting.')
            process.exit(1)
          }
          console.log(`Last value: ${lastMetricValue}`)
        } catch (e) {
          console.error(e)
          process.exit(1)
        }

        const currentMetricValue = countByMetric(currentOccurrences)[metricName] || 0
        console.log(`Current value: ${currentMetricValue}`)

        const diff = currentMetricValue - lastMetricValue
        console.log(`Difference: ${diff}`)

        // Log added occurrences if any
        if (diff > 0) {
          console.log('Added occurrences:')
          const currentMetricOccurrences = currentOccurrences.filter((o) => o.metricName === metricName)
          const currentMetricOccurrencesTexts = currentMetricOccurrences.map((o) => o.text)
          const previousOccurrencesTexts = previousOccurrences.map((occurrence) => occurrence.text)
          console.log(currentMetricOccurrencesTexts.filter((x) => !previousOccurrencesTexts.includes(x)))
        }

        // Return an error code if the metric increased
        if (diff > 0 && options.errorIfIncrease) process.exit(1)
      }
    })
}
