import { CONFIG_FILE_LOCAL_PATHS } from './configuration.js'
import { toISODate } from './date.js'
import { panic } from './error.js'
import sh from './sh.js'

export const git = async (cmd: string): Promise<string[]> => {
  const { stdout } = await sh(`git ${cmd}`)
  return stdout.toString().split('\n').filter(Boolean)
}

export async function gitProjectRoot() {
  const { stdout } = await sh('git rev-parse --show-toplevel')
  return stdout.toString().trim()
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
export const gitRemoteUrl = async () => {
  const remotes = await git('remote')
  if (!remotes.length) return null

  return (await git(`remote get-url ${remotes[0]}`))[0]
}

/**
 * Guesses the project name based on the remote URL of the git repository.
 * If the remote URL is not found, returns an empty string.
 */
export function guessProjectName(remoteUrl: string | null): string | null {
  if (typeof remoteUrl !== 'string') {
    panic("You must provide a remote URL to guess the project's name")
    return null
  }

  // Handle https remotes, such as in https://github.com/cherrypush/cherry-cli.git
  if (remoteUrl.includes('https://')) return remoteUrl.split('/').slice(-2).join('/').replace('.git', '')

  // Handle ssh remotes, such as in git@github.com:cherrypush/cherry-cli.git
  if (remoteUrl.includes('git@')) return remoteUrl.split(':').slice(-1)[0].replace('.git', '')

  return null
}

export function guessRepositorySubdir({
  configFile,
  projectRoot,
}: {
  projectRoot: string
  configFile: string | null
}): string {
  if (!configFile) return ''

  return configFile.replace(projectRoot, '').split('/').slice(1, -1).join('/')
}

/**
 * Guesses the repository information based on the remote URL and the config file path.
 *
 * The remote URL is, for instance, in the form of git@github.com:cherrypush/cherry-cli.git
 * The repository info, then, would be { host: 'github', owner: 'cherrypush', name: 'cherry-cli', subdir: '' }
 */
export async function guessRepositoryInfo({
  remoteUrl,
  configFile,
  projectRoot,
}: {
  remoteUrl: string | null
  configFile: string | null
  projectRoot: string
}) {
  if (remoteUrl === null) {
    throw new Error('Could not guess repository info: no remote URL found')
  }

  // For github ssh remotes such as git@github.com:cherrypush/cherry-cli.git
  if (remoteUrl.includes('git@github.com')) {
    return {
      host: 'github.com',
      owner: remoteUrl.split(':')[1].split('/')[0],
      name: remoteUrl.split('/')[1].replace('.git', ''),
      subdir: guessRepositorySubdir({ configFile, projectRoot }),
    }
  }

  // For github https remotes such as https://github.com/cherrypush/cherry-cli.git
  if (remoteUrl.includes('https://github.com')) {
    return {
      host: 'github.com',
      owner: remoteUrl.split('/')[3],
      name: remoteUrl.split('/')[4].replace('.git', ''),
      subdir: guessRepositorySubdir({ configFile, projectRoot }),
    }
  }

  // TODO: add support for other git hosts such as GitLab and Bitbucket

  throw new Error(`Could not guess repository info from remote URL: ${remoteUrl}`)
}

export const sha = async () => (await git('rev-parse HEAD')).toString()

export const getDefaultBranchName = async () => {
  // If we are on a GitHub Action, we can use the GITHUB_BASE_REF env variable
  if (process.env.GITHUB_BASE_REF) return process.env.GITHUB_BASE_REF

  // Otherwise, we need to find the default branch name
  const defaultBranch = (await git('rev-parse --abbrev-ref origin/HEAD')).toString()
  return defaultBranch.replace('origin/', '').trim()
}

export const getMergeBase = async (currentBranchName: string, defaultBranchName: string) =>
  (await git(`merge-base ${currentBranchName} origin/${defaultBranchName}`)).toString().trim()

export const authorName = async (sha: string) => (await git(`show ${sha} --format=%an --no-patch`))[0]

export const authorEmail = async (sha: string) => (await git(`show ${sha} --format=%ae --no-patch`))[0]

export const commitDate = async (sha: string) => new Date((await git(`show -s --format=%ci ${sha}`))[0])

export const commitShaAt = async (date: Date, branch: string) =>
  (await git(`rev-list --reverse --after=${toISODate(date)} ${branch}`))[0]

export const checkout = async (sha: string) => {
  console.log(`Checking out ${sha}`)
  await git(`checkout ${sha}`)
}

export const branchName = async () => (await git(`branch --show-current`))[0]

export const uncommittedFiles = async () => git('status --porcelain=v1')
