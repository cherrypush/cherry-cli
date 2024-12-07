import { Repository } from './types.js'

export function getConfigTemplate(repositoryInfo: Repository) {
  return `// For detailed configuration options, see the documentation:
// https://www.cherrypush.com/docs
//
// In this configuration file, you can set up your repository information,
// enable plugins, and define custom metrics for your codebase.

export default {
  repository: {
    host: '${repositoryInfo.host}',
    owner: '${repositoryInfo.owner}',
    name: '${repositoryInfo.name}',
    subdir: '${repositoryInfo.subdir}',
  },
  plugins: { loc: {} },
  metrics: [
    {
      name: 'TODO/FIXME',
      pattern: /(TODO|FIXME):/i,
    },
  ],
}`
}

export function getWorkflowTemplate() {
  return `name: cherry push

on:
  push:
    branches:
      - \${{ github.event.repository.default_branch }}

jobs:
  cherry_push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout project
        uses: actions/checkout@v4

      - name: Install dependencies
        run: npm i -g cherrypush

      - name: Push metrics to Cherry
        run: cherry push --quiet --api-key=\${{ secrets.CHERRY_API_KEY }}`
}
