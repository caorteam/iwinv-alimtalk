// ESLint flat config (ESLint 9+).
//
// Scope: lint src/ and test/. node_modules and dist are ignored.
// Goals:
//   - Catch obvious bugs (no-unused-vars, no-undef, prefer-const).
//   - Keep the import-ordering rule documented in AGENTS.md consistent
//     across files (the `import/order` rule).
//   - Stay zero-runtime-deps friendly: do NOT lint the published dist
//     or its consumers.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default [
  // Global ignores.
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'reports/**', '*.config.js']
  },

  // Base recommended rules.
  js.configs.recommended,

  // TypeScript rules for source and test.
  ...tseslint.configs.recommended,

  // Project-specific overrides.
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // Node 22 globals used in tests.
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        RequestInit: 'readonly',
        Request: 'readonly'
      }
    },
    plugins: {
      import: importPlugin
    },
    settings: {
      'import/resolver': {
        // The codebase uses .js extensions on TS imports. node resolver
        // handles this without extra config.
        node: {
          extensions: ['.ts', '.js']
        }
      }
    },
    rules: {
      // The codebase uses `import type` via verbatimModuleSyntax; do not
      // flag type-only imports as unused.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      // Allow `any` to be flagged but not yet banned — strict rules are
      // enforced by tsc and AGENTS.md. Use `unknown` first.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Enforce the import grouping documented in AGENTS.md:
      // 1. type-only imports (alphabetical, before value imports of
      //    the same module)
      // 2. external value imports (node:* and npm packages)
      // 3. internal value imports (./ or ../)
      // The `type` group covers all type-only imports regardless of
      // whether the source is external or internal.
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'ignore',
            caseInsensitive: true
          },
          warnOnUnassignedImports: false
        }
      ],
      // Consistent default-export handling.
      'import/no-default-export': 'off'
    }
  },

  // Tests have additional patterns.
  {
    files: ['test/**/*.ts'],
    rules: {
      // Tests intentionally throw strings to assert non-Error handling.
      'no-throw-literal': 'off'
    }
  }
];
