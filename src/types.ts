export type Occurrence = {
  metricName: string
  filePath: string
  text: string
  value: number
  lineNumber?: number
  url?: string
  owners?: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Codeowners = any

export type EvalMetric = {
  name: string
  eval: (options: { codeOwners: Codeowners }) => Promise<Occurrence[]>
}

type Glob = string

export type PatternMetric = {
  name: string
  pattern?: RegExp
  include?: Glob | Glob[]
  exclude?: Glob | Glob[]
  groupByFile?: boolean
}

export type Metric = {
  name: string
  eval: () => Promise<Occurrence[]>
}

export type Configuration = {
  project_name: string
  permalink: () => string
  metrics: Metric[]
  plugins: Record<string, object>
}
