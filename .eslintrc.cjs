module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'prettier', 'plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint'],
  root: true,
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {},
}
