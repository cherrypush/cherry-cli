import _ from 'lodash'
import semver, { ReleaseType } from 'semver'
import { panic } from '../error.js'
import { emptyMetric } from '../occurrences.js'
import sh from '../sh.js'

// We know there are a other release types, but we're only interested in these three
const RELEASE_TYPES = ['major', 'minor', 'patch']

type Dependency = {
  name: string
  current: string
  wanted: string
  latest: string
  type: string
  url: string
}

function buildMetricName(packageJsonPath: string, version_diff_type: string) {
  return `[yarnOutdated] outdated dependencies for ${packageJsonPath} (${version_diff_type})`
}

function possibleMetricNames(packageJsonPath: string) {
  return RELEASE_TYPES.map((type) => buildMetricName(packageJsonPath, type))
}

function getMetricName(packageJsonPath: string, current: string, latest: string) {
  // We know there's a diff because we're only looking at outdated dependencies
  // So we can safely cast the result of semver.diff to ReleaseType, thus assuming it's not null
  const version_diff_type = semver.diff(current, latest) as ReleaseType

  return buildMetricName(packageJsonPath, version_diff_type)
}

const run = async ({ cwd }: { cwd: string }) => {
  const outdatedDependencies: Dependency[] = []
  let output = ''
  const command = cwd ? `yarn outdated --cwd ${cwd} --no-progress` : 'yarn outdated'
  const packageJsonPath = _.compact([cwd, 'package.json']).join('/')

  try {
    const { stdout, stderr } = await sh(command, { throwOnError: false })
    output = stdout
    if (stderr) throw stderr
  } catch (error) {
    panic(error)
  }

  output.split('\n').forEach((line) => {
    const [name, current, wanted, latest, type, url] = line.split(/\s+/)
    if (name === 'Package') return // Discard header
    if (!name || !current || !wanted || !latest || !type || !url) return // Discard irrelevant lines
    outdatedDependencies.push({ name, current, wanted, latest, type, url })
  })

  const occurrences = outdatedDependencies.map((dependency) => ({
    text: `${dependency.name} (${dependency.current} -> ${dependency.latest})`,
    metricName: getMetricName(packageJsonPath, dependency.current, dependency.latest),
  }))

  return possibleMetricNames(packageJsonPath).map((metricName) => {
    const found = occurrences.filter((occurrence) => occurrence.metricName === metricName)
    return found.length > 0 ? found : emptyMetric(metricName)
  })
}

export default { run }
