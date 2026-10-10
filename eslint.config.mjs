import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // Pages Router effects synchronize route queries, persisted preferences, and shell slots.
      'react-hooks/set-state-in-effect': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    files: ['*.config.js', 'scripts/*.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'test-results/**',
    'playwright-report/**',
    'public/card-data/**',
    'next-env.d.ts',
  ]),
]);
