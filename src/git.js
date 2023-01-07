import { CONFIG_FILE_NAME } from './configuration.js'
import { toISODate } from './date.js'
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
  const rejectedFiles = [...deletedFiles, CONFIG_FILE_NAME]

  return trackedFiles.concat(untrackedFiles).filter((file) => !rejectedFiles.includes(file))
}

export const guessProjectName = async () => {
  const remotes = await git('remote')
  if (!remotes.length) return ''

  const url = (await git(`remote get-url ${remotes[0]}`))[0]
  if (!url) return ''

  const matches = Array.from(url.matchAll(REPO_NAME_REGEX))[0]
  return matches[1] || ''
}

export const sha = async () => (await git('rev-parse HEAD')).toString()

export const commitDate = async (sha) => new Date((await git(`show -s --format=%ci ${sha}`))[0])

export const commitShaAt = async (date, branch) =>
  (await git(`rev-list --reverse --after="${toISODate(date)}" ${branch}`))[0]

export const checkout = async (sha) => await git(`checkout ${sha}`)

export const branchName = async () => (await git(`branch --show-current  `))[0]

export const uncommittedFiles = async () => await git('status --porcelain=v1')

// Returns commits from beginSha to endSha, from oldest to most recent
export const getCommits = async (beginSha, endSha) => {
  const separator = '&cherry-cli-output-separator&'
  const format = `%an${separator}%ae${separator}%H${separator}%cI`
  // --first-parent to only consider resulting merge commits (and not commits in merged branch)
  // --reverse so oldest commits come first
  const betweenCommits = await git(
    `rev-list ${beginSha}..${endSha} --format=${format} --no-commit-header --first-parent --reverse`
  )
  // const beginCommit = await git(`show ${beginSha} --format=${format} --quiet`)
  const beginCommit = []
  const commits = beginCommit.concat(betweenCommits)

  return commits.map((line) => {
    const [authorName, authorEmail, sha, isoDate] = line.split(separator)
    return { sha, authorName, authorEmail, isoDate }
  })
}

// export const diff = async (sha) => {
//   const lines = await git(`show ${sha} -U1000000000 --format=""`)
//   const filesContent = []
//   for(const line of lines) {

//   }
//   const filename = lines.find((line) => line.startsWith('+++ b/')).replace(/^+++ b\//, '')
//   const fileContentStartIndex = lines.findIndex((line) => line.startsWith('@@ ')) + 1
//   const linesBefore = []
//   const linesAfter = []
//   lines.slice(fileContentStartIndex).map((line) => {
//     if (line.startsWith('-')) linesBefore.push(line.replace(/^-/, ''))
//     else if (line.startsWith('+')) linesAfter.push(line.replace(/^\+/, ''))
//     else {
//       linesBefore.push(line)
//       linesAfter.push(line)
//     }
//   })
// }

// Catch to prevent "fatal: path '...' exists on disk, but not in 'sha'"
export const contentAtSha = (path, sha) => git(`show ${sha}:${path}`).catch(() => [])

export const changedFiles = (sha) => git(`diff-tree --no-commit-id --name-only -r ${sha}`)

export const previousSha = async (sha) => {
  try {
    return (await git(`show ${sha}~ --format=%H`))[0]
  } catch (error) {} // When no previous commit exists
}
