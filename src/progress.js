import cliProgress from 'cli-progress'

export const newProgress = () =>
  new cliProgress.SingleBar({ format: '{bar} {value}/{total} files inspected' }, cliProgress.Presets.shades_classic)
