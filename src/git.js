import { execSync } from 'child_process'

const REPO_NAME_REGEX = /([\w\-_\.]+\/[\w\-_\.]+)\.git/g

const git = (cmd) => execSync(`git ${cmd}`).toString().split('\n').filter(Boolean)

export const files = (fileToIgnore) => {
  const trackedFiles = git('ls-files')
  const untrackedFiles = git('ls-files --others --exclude-standard')
  const deletedFiles = git('ls-files -d').concat(!!fileToIgnore ? [fileToIgnore] : [])

  return trackedFiles.concat(untrackedFiles).filter((file) => !deletedFiles.includes(file))
}

export const guessRepoName = () => {
  const url = git('remote get-url origin')[0]
  if (!url) return ''

  const matches = Array.from(url.matchAll(REPO_NAME_REGEX))[0]
  return matches[1] || ''
}

export const sha = () => git('rev-parse HEAD')
