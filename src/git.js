import { execSync } from 'child_process'
import { JSON_EXPORT_PATH } from '../bin/cherry.js'
import { CONFIG_FILE_NAME } from './configuration.js'

const REPO_NAME_REGEX = /([\w\-_\.]+\/[\w\-_\.]+)\.git/g

const git = (cmd) => execSync(`git ${cmd}`).toString().split('\n').filter(Boolean)

export const files = () => {
  // TODO: we should abort if there are uncommitted changes, otherwise the permalinks might be broken
  const trackedFiles = git('ls-files')
  const untrackedFiles = git('ls-files --others --exclude-standard')
  const deletedFiles = git('ls-files -d')
  const rejectedFiles = [...deletedFiles, JSON_EXPORT_PATH, CONFIG_FILE_NAME]

  return trackedFiles.concat(untrackedFiles).filter((file) => !rejectedFiles.includes(file))
}

export const guessRepoName = () => {
  const url = git('remote get-url origin')[0]
  if (!url) return ''

  const matches = Array.from(url.matchAll(REPO_NAME_REGEX))[0]
  return matches[1] || ''
}

export const sha = () => git('rev-parse HEAD').toString()
