# iwinv-alimtalk-cli — Agent Guidelines

Zero-dependency Node 22+ ESM library + CLI for the iwinv Alimtalk API. Strict TypeScript, 100% coverage policy, no runtime deps.

## Build & Test

```bash
npm run build           # clean + tsc → dist/
npm test                # build, then `node --test dist/test/*.test.js`
npm run test:coverage   # same, with 100% line/branch/function gate
```

- Tests run against **compiled output in `dist/`**, never raw `.ts`. Don't break the build contract.
- `postbuild` runs `chmod +x dist/src/bin.js` — the shebang CLI depends on it. Don't remove.
- `npm run prepublishOnly` rebuilds before publish; `dist/src/` is the only shipped directory.

## Architecture

Three layers, single direction of dependency:

| Layer | File | Role |
|-------|------|------|
| Entry | [src/bin.ts](src/bin.ts) | Shebang → `main()`; sets `process.exitCode` |
| CLI | [src/cli.ts](src/cli.ts) | `parseArgs`, `resolveCommand`, `readJsonBody`, `requestApi`/`buildDryRun`, output |
| HTTP | [src/client.ts](src/client.ts) | Endpoints table, base64 AUTH, fetch, `ApiError`, dry-run builder |
| Input | [src/input.ts](src/input.ts) | JSON source unification: `--json`, `--file`, stdin (async iterable) |
| Public | [src/index.ts](src/index.ts) | Barrel — re-exports `client` + `input` |

Execution flow: `bin` → `cli.main` → `parseArgs` → `resolveCommand` → `readJsonBody` (if needed) → `requestApi` or `buildDryRun` → stdout/stderr → exit.

## Core Conventions

### Zero runtime dependencies
`package.json` has **no `dependencies` field**. Adding one is a breaking change. Use Node built-ins (`node:test`, `node:assert/strict`, `fetch`, `Buffer`, `fs/promises`).

### Adding a new endpoint
The `endpoints` table in [src/client.ts](src/client.ts) is the single source of truth. To add support:
1. Add entry to the `endpoints` map (method, path, whether body is required).
2. `Command` and the dry-run/CLI types are **derived** from this map — keep types inferred, don't widen.
3. Add a test in [test/client.test.ts](test/client.test.ts) for HTTP shape (mock fetch), and in [test/cli.test.ts](test/cli.test.ts) for argument validation.
4. The 100% coverage gate will fail unless every branch is exercised.

### TypeScript style
- ESM + `NodeNext` module resolution. **No `require()`**, no CommonJS interop tricks.
- `verbatimModuleSyntax` is on → use `import type` for type-only imports.
- `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` are on → treat index access and optional props as potentially `undefined`; never use `any`.
- Prefer `unknown` over `any` for error/data; narrow explicitly.
- Use `Object.freeze` + `satisfies Record<...>` for static + runtime safety (see endpoints table pattern).

### Import ordering
The project has no automatic formatter (no Prettier, no ESLint), so the import order is enforced by humans. Follow this rule in every `.ts` file unless the file is already consistent with a different convention:

1. **First block** — Node and external type-only imports, one per line:
   ```ts
   import type { Writable } from 'node:stream';
   import type { Command } from './client.js';
   ```
2. **Second block** — value imports for Node and external modules, one per line:
   ```ts
   import assert from 'node:assert/strict';
   import { Readable, Writable } from 'node:stream';
   import { main, parseArgs, resolveCommand } from '../src/cli.js';
   import { readJsonBody } from '../src/input.js';
   ```
3. Within each block, order alphabetically by module specifier (case-insensitive). When a module exports both a type and a value, place the type-only form first.
4. Never mix type-only and value imports on the same line.

This keeps `verbatimModuleSyntax` happy and produces stable diffs when modules are added or moved.

### Error handling
- **User input errors**: `throw new Error(...)` in helpers, catch in `main()` → print to stderr with usage hint → `exit 1`.
- **API errors**: throw `ApiError(status, body)` from `client.ts`.
- **Non-Error throws** must be stringified — assume anything could be thrown.

### CLI argument parsing
- Manual loop in `parseArgs`; reject unknown options explicitly.
- `--json` and `--file` are mutually exclusive.
- `--api-key` flag overrides the `IWINV_ALIMTALK_API_KEY` environment variable (flag wins).
- Body-having endpoints reject runs without exactly one of `--json`/`--file`/stdin.
- `--help` / `-h` **must be used alone**. Mixing it with any positional or other flag (commands, `--api-key`, `--json`, `--file`, `--dry-run`, `--pretty`) throws `--help must be used alone; it cannot be combined with other arguments.` This prevents `--help` from masking real parse errors (e.g. malformed JSON).

### Testing
- **Framework**: Node built-in `node:test` + `node:assert/strict`. No Jest/Vitest.
- **No real API calls** — always inject `fetch` via the `fetchImpl` parameter or replace `globalThis.fetch` temporarily.
- **Stdin tests**: use the `JsonInputStdin` async iterable abstraction — pass a custom iterable, don't fork real streams unless the test specifically requires TTY behavior.
- **stdout/stderr capture**: use `memory` writable helpers.
- **File tests**: write to `tmpdir`, clean up.

### Coverage gate
`npm run test:coverage` enforces **100/100/100** (line/branch/function). Every `if`, every `throw`, every default branch needs a test. Plan coverage before writing code.

## Things to watch out for

- **`engines.node >= 22`** and `src/client.ts` error messages now match (`Node 22+ built-in fetch is required`). Keep these in sync if either side changes.
- The single-source body rule is enforced in **two places** (`cli.ts` and `input.ts`) as defense-in-depth. Don't consolidate them unless you can prove equivalence.
- **Dry-run AUTH header safety**: `buildDryRun` substitutes the exported `DRY_RUN_PLACEHOLDER` constant when the API key is omitted **or empty**. The placeholder value must never appear verbatim in the redacted AUTH header — tests in [test/client.test.ts](test/client.test.ts) assert this. Empty-string keys MUST NOT produce an empty AUTH header.
- Dist is the runtime artifact — never `gitignore` it (it's in `package.json#files`). Don't hand-edit anything under `dist/`.

## Documentation

These cover usage, API, and dev workflow — **link, don't duplicate**:

- [README.md](README.md) — primary docs
- [README.en.md](README.en.md) — English version
- [README.ko.md](README.ko.md) — Korean version
- [LICENSE](LICENSE) — MIT