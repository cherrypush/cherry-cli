// For detailed configuration options, see the documentation:
// https://www.cherrypush.com/docs
//
// In this configuration file, you can set up your repository information,
// enable plugins, and build custom metrics for your codebase.

module.exports = {
  repository: {
    host: 'github.com',
    owner: 'cherrypush',
    name: 'cherry-cli',
    subdir: '',
  },
  plugins: { loc: {} },
  metrics: [
    {
      name: 'TODO/FIXME',
      pattern: /(TODO|FIXME):/i, // the i flag makes the regex case insensitive
    },
  ],
}
