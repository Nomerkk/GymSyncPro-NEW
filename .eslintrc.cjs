/* Root ESLint configuration enforcing deprecation of apiRequest. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.server.json'],
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist/', 'uploads/', '*.d.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "ImportSpecifier[imported.name='apiRequest']",
        message: 'apiRequest is deprecated. Use domain services + httpFetch instead.',
      },
      {
        selector: "CallExpression[callee.name='apiRequest']",
        message: 'apiRequest is deprecated. Use a domain service (services/*) + hook layer.',
      },
    ],
  },
  overrides: [
    {
      // Allow internal usage inside the file that defines it
      files: ['client/src/lib/queryClient.ts'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
