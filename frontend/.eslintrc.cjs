module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'airbnb',
    'airbnb-typescript',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts', '**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
  },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': [1, { 'extensions': ['.js', '.jsx', '.ts', '.tsx'] }],
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off',
    'import/extensions': ['error', 'ignorePackages', {
      'ts': 'never',
      'tsx': 'never',
      'js': 'never',
      'jsx': 'never',
      'mts': 'never'
    }],
    'import/no-extraneous-dependencies': ['error', { 'devDependencies': true }],
    'no-underscore-dangle': ['error', {
      'allow': ['_canInitEmulator', '_settingsFrozen']
    }],
    'no-nested-ternary': 'off',
    'no-console': ['warn', { 'allow': ['error', 'warn'] }],
    'jsx-a11y/label-has-associated-control': ['error', {
      'assert': 'either'
    }],
    'import/prefer-default-export': 'off',
    'react/no-array-index-key': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/control-has-associated-label': 'warn',
    'react/button-has-type': 'warn',
    'react/no-unescaped-entities': 'warn',
    'react/no-danger': 'warn',
    'no-plusplus': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
    '@typescript-eslint/no-shadow': ['error', { 'ignoreOnInitialization': true }],
    '@typescript-eslint/naming-convention': ['error', {
      'selector': 'variable',
      'format': ['camelCase', 'PascalCase', 'UPPER_CASE'],
      'leadingUnderscore': 'allow'
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    'consistent-return': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
}
