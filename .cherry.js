export default {
  repo: 'cherrypush/cherry-cli',
  metrics: [
    {
      name: 'todo',
      pattern: /TODO:/i, // the i flag makes the regex case insensitive
    },
    {
      name: 'fixme',
      pattern: /FIXME:/i,
    },
    {
      name: 'rubobop',
      pattern: /rubocop:disable/,
    },
    {
      name: 'eslint',
      pattern: /eslint-disable/,
    },
  ],
}
