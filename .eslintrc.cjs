module.exports = {
  ignorePatterns: ['dist/', 'node_modules/'],
  env: {
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'prettier', 'plugin:@typescript-eslint/recommended'],
  root: true,
  overrides: [],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      // We need to ignore unused variables that start with an underscore to avoid linting errors on catch(error) blocks
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
}
