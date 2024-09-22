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
