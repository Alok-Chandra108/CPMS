/**
 * Custom ESLint Security Configuration for Frontend
 * Extends recommended security rules for React/TypeScript applications
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    jest: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:security/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    project: './tsconfig.json'
  },
  plugins: [
    'security',
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'no-secrets'
  ],
  settings: {
    react: {
      version: '18'
    }
  },
  rules: {
    // Security plugin rules
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': ['error', { allowUndefined: false }],

    // TypeScript security rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',

    // React security rules
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',
    'react/no-unused-prop-types': 'warn',
    'react/prop-types': 'off', // Using TypeScript for prop types

    // JSX Accessibility (security related)
    'jsx-a11y/no-onchange': 'warn',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/role-has-required-aria-props': 'error',

    // Secret detection
    'no-secrets/no-secrets': 'error',

    // General security best practices
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-prototype-builtins': 'error',
    
    // Additional security rules
    'prefer-arrow-callback': 'warn',
    'no-return-await': 'warn',
    'require-await': 'warn'
  },
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/test/**/*.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/__mocks__/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        'react/no-danger': 'off'
      }
    },
    {
      files: ['**/*.config.{js,ts}', '**/vite.config.{js,ts}', '**/jest.config.{js,ts}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'security/detect-non-literal-require': 'off',
        'security/detect-object-injection': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '*.config.js',
    '*.config.ts',
    '.eslintrc.*',
    '*.d.ts'
  ]
};
