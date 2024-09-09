import { CONFIG_FILE_LOCAL_PATHS } from './configuration.js'
import sh from './sh.js'
import { toISODate } from './date.js'

export const git = async (cmd) => {
  const { stdout } = await sh(`git ${cmd}`)
  return stdout.toString().split('\n').filter(Boolean)
}

export const files = async () => {
  const trackedFiles = await git('ls-files')
  const untrackedFiles = await git('ls-files --others --exclude-standard')
  const deletedFiles = await git('ls-files -d')
  const rejectedFiles = [...deletedFiles, ...CONFIG_FILE_LOCAL_PATHS]

  return trackedFiles.concat(untrackedFiles).filter((file) => !rejectedFiles.includes(file))
}

/**
 * Retrieves the URL of the first Git remote for the current path.
 */
export const getRemoteUrl = async () => {
  const remotes = await git('remote')
  if (!remotes.length) return null

  return (await git(`remote get-url ${remotes[0]}`))[0]
}

/**
 * Guesses the project name based on the remote URL of the git repository.
 * If the remote URL is not found, returns null.
 *
 * @param {string} remoteUrl - The remote URL of the git repository.
 * @returns {string|null} The guessed project name or null if it cannot be determined.
 */
export const guessProjectName = (remoteUrl) => {
  if (!remoteUrl) return null

  // Handle https remotes, such as in https://github.com/cherrypush/cherry-cli.git
  if (remoteUrl.includes('https://')) return remoteUrl.split('/').slice(-2).join('/').replace('.git', '')

  // Handle ssh remotes, such as in git@github.com:cherrypush/cherry-cli.git
  if (remoteUrl.includes('git@')) return remoteUrl.split(':').slice(-1)[0].replace('.git', '')

  return null
}

export const sha = async () => (await git('rev-parse HEAD')).toString()

export const getDefaultBranchName = async () => {
  // If we are on a GitHub Action, we can use the GITHUB_BASE_REF env variable
  if (process.env.GITHUB_BASE_REF) return process.env.GITHUB_BASE_REF

  // Otherwise, we need to find the default branch name
  const defaultBranch = (await git('rev-parse --abbrev-ref origin/HEAD')).toString()
  return defaultBranch.replace('origin/', '').trim()
}

export const getMergeBase = async (currentBranchName, defaultBranchName) =>
  (await git(`merge-base ${currentBranchName} origin/${defaultBranchName}`)).toString().trim()

/**
 * Gets the author name of a commit.
 * @param {string} sha - The commit SHA.
 * @returns {Promise<string>} The author name.
 */
export const authorName = async (sha) => (await git(`show ${sha} --format=%an --no-patch`))[0]

/**
 * Gets the author email of a commit.
 * @param {string} sha - The commit SHA.
 * @returns {Promise<string>} The author email.
 */
export const authorEmail = async (sha) => (await git(`show ${sha} --format=%ae --no-patch`))[0]

/**
 * Gets the commit date of a commit.
 * @param {string} sha - The commit SHA.
 * @returns {Promise<Date>} The commit date.
 */
export const commitDate = async (sha) => new Date((await git(`show -s --format=%ci ${sha}`))[0])

/**
 * Gets a commit SHA at a given date.
 * @param {Date} date - The date.
 * @param {string} branch - The branch name.
 * @returns {Promise<string>} The commit SHA.
 */
export const commitShaAt = async (date, branch) =>
  (await git(`rev-list --reverse --after=${toISODate(date)} ${branch}`))[0]

/**
 * Checks out a commit.
 * @param {string} sha - The commit SHA.
 */
export const checkout = async (sha) => {
  console.log(`Checking out ${sha}`)
  await git(`checkout ${sha}`)
}

/**
 * Gets the name of the current Git branch.
 * @returns {Promise<string>} The name of the current branch as a string.
 */
export const branchName = async () => (await git(`branch --show-current`))[0]

/**
 * Retrieves a list of uncommitted files in the working directory.
 * @returns {Promise<string[]>} A promise that resolves to an array of uncommitted files and their statuses.
 */
export const uncommittedFiles = async () => await git('status --porcelain=v1')
