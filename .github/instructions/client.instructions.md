---
description: 'Use when editing src/client.ts or the endpoints table — covers the AUTH encoding, the derived Command type pattern, and the dry-run builder.'
applyTo: 'src/client.ts'
---

# HTTP Client Layer Rules

The `endpoints` table in [src/client.ts](../src/client.ts) is the **single source of truth** for the entire client/CLI surface. Treat it as a contract.

## Adding or modifying an endpoint

1. **Edit the `endpoints` map only** (method, path, `body` boolean). Do not hand-roll command enums elsewhere.
2. `Command`, dry-run option types, and CLI flag types are **derived** from this map (via `(typeof endpoints)[keyof typeof endpoints]`-style inference). Keep them inferred — do not widen to a hand-maintained union.
3. The `body: true` flag drives the body-required check in both [src/cli.ts](../src/cli.ts) and [src/input.ts](../src/input.ts). Set it correctly; both layers must agree.
4. **Endpoint coverage gate**: every new endpoint needs a test in [test/client.test.ts](../test/client.test.ts) (HTTP shape, mock fetch) **and** [test/cli.test.ts](../test/cli.test.ts) (argument validation, body requirement).

## AUTH header

- The `IWINV_ALIMTALK_API_KEY` is UTF-8 base64-encoded into the `AUTH` header (raw key bytes → base64 string). Do not use `btoa`/`atob` shortcuts; use `Buffer.from(key, 'utf8').toString('base64')`.
- `--api-key` flag overrides the `IWINV_ALIMTALK_API_KEY` env var. Flag wins.

## Request shape

- **GET**: no `Content-Type`, no body. Respect this — sending a body on a GET will trip the server.
- **POST**: `Content-Type: application/json` and a body. Default to `{}` if no `--json`/`--file`/stdin was provided **and** the endpoint allows empty body; otherwise reject in CLI before reaching the client.

## Response handling

- Read response as **text first**, then attempt `JSON.parse`. On parse failure, keep the raw text. Callers (and the API contract) rely on this two-step shape.
- Non-2xx → throw `ApiError(status, body)` with the parsed body (or raw text). Do not throw plain `Error` for API failures.

## Dry-run

- `buildDryRun` returns the **outgoing request** (method, URL, headers, body) without calling `fetch`. It must mirror the real request 1:1 — when in doubt, refactor to share a builder.
- Coverage requires that the dry-run path is exercised even when the live path is also tested.
- **Key safety**: `buildDryRun` accepts an optional `apiKey`. When omitted **or empty**, it substitutes the exported `DRY_RUN_PLACEHOLDER` constant. Never fall back on `''` (empty string) silently — that would emit an empty `AUTH` header. The AUTH output is **always** passed through `redactAuth`, so both placeholder base64 and real keys appear as `<redacted>` (or `1234...cdef` for long values). Tests assert that the placeholder string itself never appears verbatim in the redacted header.

## Things to watch out for

- The `endpoints` table is `Object.freeze`-d with `satisfies Record<...>`. Don't loosen it.
- `noUncheckedIndexedAccess` is on → index access into headers / `endpoints` is `T | undefined`. Narrow before use.
- The "fetch is not available" error message references `Node 22+` to match `engines.node`. Keep both sides in sync if either changes.
