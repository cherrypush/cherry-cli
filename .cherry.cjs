const JS_FILES = '**/*.{js,jsx}'
const TS_FILES = '**/*.{ts,tsx}'

module.exports = {
  project_name: 'cherrypush/cherry-cli',
  plugins: {
    // npmOutdated: {}, // TODO: this requires an active internet connection thus should not be used in tests
    loc: {},
    eslint: {},
    jsCircularDependencies: { include: 'src/**' },
    // jsUnimported: {}, // TODO: investigate why this takes so long with a slow internet connection
  },
  metrics: [
    {
      name: 'TODO',
      pattern: /TODO/,
    },
    {
      name: '[TS Migration] TS lines of code',
      include: TS_FILES,
      groupByFile: true,
    },
    {
      name: '[TS Migration] JS lines of code',
      include: JS_FILES,
      groupByFile: true,
    },
  ],
}
