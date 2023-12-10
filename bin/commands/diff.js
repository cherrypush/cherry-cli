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

      const initialBranch = await git.branchName()
      if (!initialBranch) panic('Not on a branch, checkout a branch before running the backfill.')

      const currentOccurrences = await findOccurrences({
        configuration,
        files: await getFiles(),
        codeOwners: new Codeowners(),
        quiet: options.quiet,
      })

      // TODO: we should not calculate previous occurrences if we're going to use an input file
      const mergeBaseSha = await git.mergeBaseSha()
      await git.checkout(mergeBaseSha)
      previousOccurrences = await findOccurrences({
        configuration,
        files: await getFiles(),
        codeOwners: new Codeowners(),
        quiet: options.quiet,
      })

      for (const metric of metrics) {
        try {
          console.log('-----------------------------------')

          // if (inputFile) {
          //   const content = fs.readFileSync(inputFile, 'utf8')
          //   const metrics = JSON.parse(content)
          //   metricOccurrences = metrics.find((m) => m.name === metric)?.currentOccurrences || []
          //   lastMetricValue = _.sumBy(metricOccurrences, (occurrence) =>
          //     _.isNumber(occurrence.value) ? occurrence.value : 1
          //   )
          // }

          let lastMetricValue = countByMetric(previousOccurrences)[metric] || 0

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

        console.log(currentMetricValue, lastMetricValue)

        const diff = currentMetricValue - lastMetricValue
        console.log(`Difference: ${diff}`)

        if (diff > 0) {
          console.log('Added occurrences:')
          const currentOccurrencesTexts = currentOccurrences.filter((o) => o.metricName === metric).map((o) => o.text)
          const previousOccurrencesTexts = previousOccurrences.map((occurrence) => occurrence.text)
          console.log(currentOccurrencesTexts.filter((x) => !previousOccurrencesTexts.includes(x)))
        }

        await git.checkout(initialBranch)

        if (diff > 0 && options.errorIfIncrease) process.exit(1)
      }
    })
}
