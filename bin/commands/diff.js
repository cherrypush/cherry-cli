import fs from 'fs'
import _ from 'lodash'
import Codeowners from '../../src/codeowners.js'
import { getConfiguration } from '../../src/configuration.js'
import { getFiles } from '../../src/files.js'
import { findOccurrences } from '../../src/occurrences.js'
import { countByMetric } from '../helpers.js'
import * as git from '../../src/git.js'
import { panic } from '../../src/error.js'

export default function (program) {
  program
    .command('diff')
    .requiredOption('--metric <metric>', 'Add a metric', (value, previous) =>
      previous ? [...previous, value] : [value]
    )
    .option('--input-file <input_file>', 'A JSON file containing the metrics to compare with')
    .option('--error-if-increase', 'Return an error status code (1) if the metric increased since its last report')
    .option('--quiet', 'reduce output to a minimum')
    .action(async (options) => {
      const configuration = await getConfiguration()
      const metrics = options.metric
      const inputFile = options.inputFile

      let lastMetricValue
      let previousOccurrences
      let metricOccurrences

      if (!inputFile) {
        const initialBranch = await git.branchName()
        if (!initialBranch) panic('Not on a branch, checkout a branch before running the backfill.')
      }

      const hasUncommitedChanges = (await git.uncommittedFiles()).length > 0
      if (hasUncommitedChanges) panic('Please commit your changes before running this command')

      const currentOccurrences = await findOccurrences({
        configuration,
        files: await getFiles(),
        codeOwners: new Codeowners(),
        quiet: options.quiet,
      })

      // TODO: revert the logic here to make it more readable, i.e, if inputFile then handle, else default flow
      // If no input file is provided, then calculate values from the merge base
      if (!inputFile) {
        const mergeBaseSha = await git.mergeBaseSha()
        await git.checkout(mergeBaseSha)
        previousOccurrences = await findOccurrences({
          configuration,
          files: await getFiles(),
          codeOwners: new Codeowners(),
          quiet: options.quiet,
        })
      }

      for (const metric of metrics) {
        try {
          console.log('-----------------------------------')
          console.log(`Metric: ${metric}`)

          if (inputFile) {
            const content = fs.readFileSync(inputFile, 'utf8')
            const metrics = JSON.parse(content)
            metricOccurrences = metrics.find((m) => m.name === metric)?.occurrences || []
            previousOccurrences = metricOccurrences
            lastMetricValue = _.sumBy(metricOccurrences, (occurrence) =>
              _.isNumber(occurrence.value) ? occurrence.value : 1
            )

            console.log(previousOccurrences)
          }

          lastMetricValue = countByMetric(previousOccurrences)[metric] || 0

          if (!Number.isInteger(lastMetricValue)) {
            console.log('No last value found for this metric, aborting.')
            process.exit(1)
          }
          console.log(`Last value: ${lastMetricValue}`)
        } catch (e) {
          console.error(e)
          process.exit(1)
        }

        const currentMetricValue = countByMetric(currentOccurrences)[metric] || 0
        console.log(`Current value: ${currentMetricValue}`)

        const diff = currentMetricValue - lastMetricValue
        console.log(`Difference: ${diff}`)

        // List added occurrences
        if (diff > 0) {
          console.log('Added occurrences:')
          const currentMetricOccurrences = currentOccurrences.filter((o) => o.metricName === metric)
          const currentMetricOccurrencesTexts = currentMetricOccurrences.map((o) => o.text)
          const previousOccurrencesTexts = previousOccurrences.map((occurrence) => occurrence.text)
          console.log(currentMetricOccurrencesTexts.filter((x) => !previousOccurrencesTexts.includes(x)))
        }

        if (diff > 0 && options.errorIfIncrease) process.exit(1)
      }

      // Bring user back to initial branch
      await git.checkout(initialBranch)
    })
}
