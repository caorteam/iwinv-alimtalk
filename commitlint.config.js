// commitlint configuration.
// Enforces Conventional Commits so release-please can drive versioning
// automatically (see .github/workflows/release-please.yml).
//
// Allowed types match the prefixes already used in this repo's recent
// history (docs:, fix:, feat:, chore:, refactor:, test:, ci:, deps:).
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'deps',
        'revert'
      ]
    ],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100]
  }
};
