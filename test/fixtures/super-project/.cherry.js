module.exports = {
  repository: {
    host: 'github',
    owner: 'cherrypush',
    name: 'cherry-cli',
    subdir: 'test/fixtures/super-project',
  },
  plugins: { loc: {} },
  metrics: [
    {
      name: 'TODO',
      pattern: 'TODO',
    },
  ],
}
