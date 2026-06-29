<!--
Thanks for contributing to @caor/iwinv-alimtalk!

This project enforces a zero-runtime-dependency policy and 100% test
coverage. Please complete the checklist below before requesting review.
Fill free-form sections; remove any section that does not apply.
-->

## Summary

<!-- One-paragraph description of the change. Link any related issues. -->

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (any change that alters the public API or CLI surface)
- [ ] Documentation / chore (no behavior change)

## Checklist

### Tests

- [ ] `npm run test:coverage` passes locally (100/100/100 line/branch/function)
- [ ] Every new branch and `throw` path has a test
- [ ] No test was deleted or weakened to make coverage pass

### Type safety

- [ ] `npx tsc -p tsconfig.json --noEmit` passes with zero errors
- [ ] No `any` was introduced; new unknown data is narrowed explicitly
- [ ] No new `import` statements mix type-only and value imports on one line
      (see [AGENTS.md → Import ordering](../blob/develop/AGENTS.md))

### Project invariants

- [ ] **No new runtime dependencies** were added to `package.json`.
      Dev-dependency additions must be justified in the PR description.
- [ ] The `endpoints` table in `src/client.ts` remains the single source
      of truth for commands and HTTP shape.
- [ ] If this PR changes CLI surface (`endpoints`, `parseArgs`, flags),
      README.md / README.ko.md / README.en.md are updated.
- [ ] If this PR changes `AGENTS.md` content, the matching
      `.github/instructions/*.md` files are checked for consistency.

### CLI behavior

- [ ] `--help` / `-h` remains a standalone-only flag
- [ ] Dry-run output never contains the real API key
      (use `DRY_RUN_PLACEHOLDER`; see `src/client.ts`)
- [ ] New error messages match the existing tone and end with a clear
      remediation hint where applicable

### Documentation

- [ ] Public API changes are reflected in README files
- [ ] Internal-only changes do not need README updates

## Related issues

<!-- e.g. Closes #123, Relates to #456 -->

## Out-of-scope follow-ups

<!-- Anything you noticed but did not address in this PR. This helps the
reviewer understand the boundaries of your change. -->
