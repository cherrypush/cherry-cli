const JS_FILES = 'app/**/*.{js,jsx}'
const TS_FILES = 'app/**/*.{ts,tsx}'

module.exports = {
  project_name: 'fwuensche/cherry-cli',
  plugins: {
    // npmOutdated: {}, // TODO: this requires an active internet connection thus should not be used in tests
    loc: {},
    eslint: {},
    jsCircularDependencies: { include: 'src/**' },
    jsUnimported: {},
  },
  metrics: [
    {
      name: 'TODO',
      pattern: /TODO/,
    },
  ],
}
