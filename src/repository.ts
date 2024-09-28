import { PermalinkFn, Repository } from './types.js'

export const buildRepoURL = (repository: Repository) =>
  `https://${repository.host}/${repository.owner}/${repository.name}`

export const buildPermalink = (
  permalink: PermalinkFn | undefined,
  repository: Repository,
  filePath: string,
  lineNumber: number | undefined
) => {
  if (!permalink) return `${buildRepoURL(repository)}/blob/HEAD/${filePath}${lineNumber ? `#L${lineNumber}` : ''}`

  return permalink({ filePath, lineNumber })
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
