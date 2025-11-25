// ESLint v9 flat config enforcing apiRequest deprecation
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['dist/', 'uploads/', '**/*.d.ts', 'client/src/pages/member-dashboard-old.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.server.json'],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Deprecation enforcement
      'no-restricted-syntax': [
        'error',
        {
          selector: "ImportSpecifier[imported.name='apiRequest']",
          message: 'apiRequest is deprecated. Use domain services + httpFetch.',
        },
        {
          selector: "CallExpression[callee.name='apiRequest']",
          message: 'apiRequest is deprecated. Use a domain service + hook layer.',
        },
      ],
    },
  },
  {
    files: ['client/src/lib/queryClient.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
];