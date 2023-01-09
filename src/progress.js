import cliProgress from 'cli-progress'

export const newMetricsProgress = () =>
  new cliProgress.SingleBar(
    { format: `Computing metrics:       {bar} {value}/{total} files` },
    cliProgress.Presets.shades_classic
  )

export const newContributionsProgress = () =>
  new cliProgress.SingleBar(
    { format: `Computing contributions: {bar} {value}/{total} commits` },
    cliProgress.Presets.shades_classic
  )
