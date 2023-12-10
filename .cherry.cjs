const JS_FILES = 'app/**/*.{js,jsx}'
const TS_FILES = 'app/**/*.{ts,tsx}'

module.exports = {
  project_name: 'fwuensche/cherry-cli',
  plugins: {
    // npmOutdated: {},
    loc: {},
    // eslint: {},
    // jsCircularDependencies: { include: 'src/**' },
    // jsUnimported: {},
  },
  metrics: [
    {
      name: 'TODO',
      pattern: /TODO/,
    },
  ],
}
