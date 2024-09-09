export const buildRepoURL = (projectName) => `https://github.com/${projectName}`

export const buildPermalink = (permalink, projectName, filePath, lineNumber) => {
  if (permalink) return permalink({ filePath, lineNumber })

  return `${buildRepoURL(projectName)}/blob/HEAD/${filePath}${lineNumber ? `#L${lineNumber}` : ''}`
}
