export type Occurrence = {
  metricName: string
  filePath?: string // TODO: it's weird that filePath is optional here, let's review this
  text: string
  value: number
  lineNumber?: number
  url?: string
  owners?: string[]
}

export type Contribution = {
  metricName: string
  diff: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Codeowners = any

export type EvalMetric = {
  name: string
  eval: (options: { codeOwners: Codeowners }) => Promise<Occurrence[]>
}

export type PatternMetric = {
  name: string
  pattern?: RegExp
  include?: string | string[]
  exclude?: string | string[]
  groupByFile?: boolean
}

export type Metric = EvalMetric | PatternMetric

export type PluginName = 'loc' | 'jsCircularDependencies' | 'eslint'
export type Plugins = Partial<Record<PluginName, object>>

export enum Host {
  Github = 'github.com',
  Gitlab = 'gitlab.com',
}

export type Repository = {
  host: Host
  owner: string // e.g. cherrypush
  name: string // e.g. cherry-cli
  subdir: string // e.g. src, or an empty string for the root
}

export type Configuration = {
  project_name: string
  repository: Repository
  permalink?: () => string
  metrics: Metric[]
  plugins?: Plugins
}

export type OutputFile = {
  name: Pick<Metric, 'name'>
  occurrences: Occurrence[]
}[]
