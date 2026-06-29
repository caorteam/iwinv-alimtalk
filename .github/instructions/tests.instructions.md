---
description: "Use when writing or modifying test files under test/** — covers the 100% coverage gate, mock-only fetch, and node:test idioms required by this repo."
applyTo: "test/**/*.ts"
---

# Test Conventions

## Framework

- **Node built-in `node:test` + `node:assert/strict`**. No Jest, Vitest, or Mocha.
- Tests run against **compiled output in `dist/test/`** (see `npm test` in [AGENTS.md](../AGENTS.md)), so every test file must produce a working `.js` artifact under `tsconfig.json#include`.

## No real network

- **Never** make a real HTTP call to the iwinv API in tests.
- Inject `fetch` via the `fetchImpl` parameter exposed by `requestApi` / `buildDryRun`, **or** replace `globalThis.fetch` temporarily inside a `try/finally` block to restore it.
- Use a `Response`-shaped object (status, ok, text()) for stubbed fetch — see existing patterns in [test/client.test.ts](../test/client.test.ts).

## Stdin

- Tests that need stdin input must use the `JsonInputStdin` async iterable abstraction from [src/input.ts](../src/input.ts), not a forked TTY stream.
- Pass a custom iterable; assert consumed bytes and that the iterable is fully drained.

## stdout / stderr capture

- Capture with `memory` writable helpers (defined in the test files). Do not pollute real `process.stdout` / `process.stderr`.
- Always assert **both** the captured stream content **and** the returned `process.exitCode`.

## File-based input

- Use `tmpdir` for `--file` scenarios. Write the file, run the assertion, delete it in a `finally` block.

## CLI argument policies under test

- **`--help` / `-h` must be tested as standalone-only.** Add a parallel `parseArgs` test asserting that pairing `--help` with positionals, `--api-key`, `--json`, `--file`, `--dry-run`, or `--pretty` throws. The corresponding `main(...)` test must assert exit code 1, an empty stdout, and an stderr containing the parse error (the "Run with --help for usage." hint is appended by `main()`).
- **Dry-run AUTH safety.** When adding tests that exercise `buildDryRun`, import `DRY_RUN_PLACEHOLDER` from `../src/client.js` rather than the literal string. Assert: (a) the placeholder value never appears verbatim in the redacted AUTH, and (b) omitted/empty `apiKey` produce identical headers.

## Coverage gate

`npm run test:coverage` enforces **100/100/100** (line/branch/function). Before merging:

- Every `if`/`else` has a test.
- Every `throw` path is exercised (including non-Error throws — test stringified handling).
- Every default / fallback branch is hit.
- Every error message variant is asserted at least once.

Plan coverage first, then write code. The gate fails the build, not just the test run.

## Style

- Strict ESM, `import type` for type-only imports (matches `verbatimModuleSyntax`).
- No `any`. Narrow with `unknown` + explicit type guards.
- Keep tests focused — one logical assertion cluster per `test()`.
