import fs from 'fs'
import _ from 'lodash'
import Codeowners from '../../src/codeowners.js'
import { getConfiguration } from '../../src/configuration.js'
import { getFiles } from '../../src/files.js'
import { findOccurrences } from '../../src/occurrences.js'
import axios from 'axios'
import { API_BASE_URL, countByMetric } from '../helpers.js'

export default function (program) {
  program
    .command('diff')
    .requiredOption('--metric <metric>', 'Add a metric', (value, previous) =>
      previous ? [...previous, value] : [value]
    )
    .option('--input-file <input_file>', 'A JSON file containing the metrics to compare with')
    .option(
      '--api-key <api_key>',
      'Your cherrypush.com API key (available on https://www.cherrypush.com/user/settings)'
    )
    .option('--error-if-increase', 'Return an error status code (1) if the metric increased since its last report')
    .option('--quiet', 'reduce output to a minimum')
    .action(async (options) => {
      const configuration = await getConfiguration()
      const apiKey = options.apiKey || process.env.CHERRY_API_KEY
      const metrics = options.metric
      const inputFile = options.inputFile

      let lastMetricValue
      let previousOccurrences

      const occurrences = await findOccurrences({
        configuration,
        files: await getFiles(),
        codeOwners: new Codeowners(),
        quiet: options.quiet,
      })

      for (const metric of metrics) {
        try {
          console.log('-----------------------------------')

          if (inputFile) {
            const content = fs.readFileSync(inputFile, 'utf8')
            const metrics = JSON.parse(content)
            const metricOccurrences = metrics.find((m) => m.name === metric)?.occurrences || []
            lastMetricValue = _.sumBy(metricOccurrences, (occurrence) =>
              _.isNumber(occurrence.value) ? occurrence.value : 1
            )
            previousOccurrences = metricOccurrences.map((occurrence) => occurrence.text)
          } else {
            console.log(`Fetching last value for metric ${metric}...`)
            const params = {
              project_name: configuration.project_name,
              metric_name: metric,
              api_key: apiKey,
            }

            const response = await axios.get(API_BASE_URL + '/metrics', { params }).catch((error) => {
              console.error(`Error: ${error.response.status} ${error.response.statusText}`)
              console.error(error.response.data.error)
              process.exit(1)
            })

            lastMetricValue = response.data.value
            previousOccurrences = response.data.occurrences
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

        const currentMetricValue = countByMetric(occurrences)[metric] || 0
        console.log(`Current value: ${currentMetricValue}`)

        const diff = currentMetricValue - lastMetricValue
        console.log(`Difference: ${diff}`)

        if (diff > 0) {
          console.log('Added occurrences:')
          const newOccurrencesTexts = occurrences.filter((o) => o.metricName === metric).map((o) => o.text)
          console.log(newOccurrencesTexts.filter((x) => !previousOccurrences.includes(x)))
        }

        if (diff > 0 && options.errorIfIncrease) process.exit(1)
      }
    })
}
