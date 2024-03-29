import fs from 'fs'
import _ from 'lodash'
import Codeowners from '../../src/codeowners.js'
import { getConfiguration } from '../../src/configuration.js'
import { panic } from '../../src/error.js'
import { getFiles } from '../../src/files.js'
import * as git from '../../src/git.js'
import { findOccurrences } from '../../src/occurrences.js'
import {
  buildMetricsPayload,
  buildSarifPayload,
  buildSonarGenericImportPayload,
  countByMetric,
  sortObject,
} from '../helpers.js'

export default function (program) {
  program
    .command('run')
    .option('--owner <owner>', 'only consider given owner code')
    .option('--metric <metric>', 'only consider given metric')
    .option('-o, --output <output>', 'export stats into a local file')
    .option('-f, --format <format>', 'export format (json, sarif, sonar). default: json')
    .option('--quiet', 'reduce output to a minimum')
    .action(async (options) => {
      const configuration = await getConfiguration()
      const codeOwners = new Codeowners()
      const owners = options.owners ? options.owners.split(',') : null
      const files = options.owner ? await getFiles(options.owner.split(','), codeOwners) : await getFiles()
      const quiet = options.quiet

      const occurrences = await findOccurrences({
        configuration,
        files,
        metric: options.metric,
        codeOwners,
        quiet,
      })
      if (options.owner || options.metric) {
        let displayedOccurrences = occurrences
        if (owners) displayedOccurrences = displayedOccurrences.filter((o) => _.intersection(o.owners, owners).length)
        if (options.metric) displayedOccurrences = displayedOccurrences.filter((o) => o.metricName === options.metric)

        displayedOccurrences.forEach((occurrence) => console.log(`👉 ${occurrence.text}`))
        console.log('Total occurrences:', displayedOccurrences.length)
      } else console.table(sortObject(countByMetric(occurrences)))

      if (options.output) {
        const filepath = process.cwd() + '/' + options.output
        const format = options.format || 'json'
        let content

        if (format === 'json') {
          const metrics = buildMetricsPayload(occurrences)
          content = JSON.stringify(metrics, null, 2)
        } else if (format === 'sarif') {
          const branch = await git.branchName()
          const sha = await git.sha()
          const sarif = buildSarifPayload(configuration.project_name, branch, sha, occurrences)
          content = JSON.stringify(sarif, null, 2)
        } else if (format === 'sonar') {
          const sonar = buildSonarGenericImportPayload(occurrences)
          content = JSON.stringify(sonar, null, 2)
        }
        fs.writeFile(filepath, content, 'utf8', function (err) {
          if (err) panic(err)
          console.log(`File has been saved as ${filepath}`)
        })
      }
    })
}
