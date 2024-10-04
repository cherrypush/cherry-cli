import _ from 'lodash'
import semverDiff from 'semver/functions/diff.js'
import { panic } from '../error.js'
import { emptyMetric } from '../occurrences.js'
import sh from '../sh.js'

const getMetricName = (cwd, current, latest) => {
  const packageJsonPath = _.compact([cwd, 'package.json']).join('/')
  const version_diff_type = semverDiff(current, latest)
  return `[yarnOutdated] outdated dependencies for ${packageJsonPath} (${version_diff_type})`
}

const run = async ({ cwd }) => {
  let outdatedDependencies = []
  let output = ''
  const command = cwd ? `yarn outdated --cwd ${cwd} --no-progress` : 'yarn outdated'

  try {
    const { stdout, stderr } = await sh(command, { throwOnError: false })
    output = stdout
    if (stderr) throw stderr
  } catch (error) {
    panic(error)
  }

  output.split('\n').forEach((line) => {
    const [name, current, wanted, latest, type, url] = line.split(/\s+/)
    if (name === 'Package') return // remove header
    if (!name || !current || !wanted || !latest || !type || !url) return // remove irrelevant lines
    outdatedDependencies.push({ name, current, wanted, latest, type, url })
  })

  const occurrences = outdatedDependencies.map((dependency) => ({
    text: `${dependency.name} (${dependency.current} -> ${dependency.latest})`,
    metricName: getMetricName(cwd, dependency.current, dependency.latest),
  }))

  return occurrences.length === 0 ? [emptyMetric(getMetricName(cwd))] : occurrences
}

export default { run }
