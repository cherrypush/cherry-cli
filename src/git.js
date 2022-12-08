import { JSON_EXPORT_PATH } from '../bin/cherry.js'
import { CONFIG_FILE_NAME } from './configuration.js'
import sh from './sh.js'

const REPO_NAME_REGEX = /([\w\-_\.]+\/[\w\-_\.]+)\.git/g

const git = async (cmd) => {
  const stdout = await sh(`git ${cmd}`)
  return stdout.toString().split('\n').filter(Boolean)
}

export const files = async () => {
  // TODO: we should abort if there are uncommitted changes, otherwise the permalinks might be broken
  const trackedFiles = await git('ls-files')
  const untrackedFiles = await git('ls-files --others --exclude-standard')
  const deletedFiles = await git('ls-files -d')
  const rejectedFiles = [...deletedFiles, JSON_EXPORT_PATH, CONFIG_FILE_NAME]

  return trackedFiles.concat(untrackedFiles).filter((file) => !rejectedFiles.includes(file))
}

export const guessRepoName = async () => {
  const url = (await git('remote get-url origin'))[0]
  if (!url) return ''

  const matches = Array.from(url.matchAll(REPO_NAME_REGEX))[0]
  return matches[1] || ''
}

export const sha = async () => (await git('rev-parse HEAD')).toString()
