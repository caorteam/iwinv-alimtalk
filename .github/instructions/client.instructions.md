---
description: "Use when editing src/client.ts or the endpoints table — covers the AUTH encoding, the derived Command type pattern, and the dry-run builder."
applyTo: "src/client.ts"
---

# HTTP Client Layer Rules

The `endpoints` table in [src/client.ts](../src/client.ts) is the **single source of truth** for the entire client/CLI surface. Treat it as a contract.

## Adding or modifying an endpoint

1. **Edit the `endpoints` map only** (method, path, `body` boolean). Do not hand-roll command enums elsewhere.
2. `Command`, dry-run option types, and CLI flag types are **derived** from this map (via `(typeof endpoints)[keyof typeof endpoints]`-style inference). Keep them inferred — do not widen to a hand-maintained union.
3. The `body: true` flag drives the body-required check in both [src/cli.ts](../src/cli.ts) and [src/input.ts](../src/input.ts). Set it correctly; both layers must agree.
4. **Endpoint coverage gate**: every new endpoint needs a test in [test/client.test.ts](../test/client.test.ts) (HTTP shape, mock fetch) **and** [test/cli.test.ts](../test/cli.test.ts) (argument validation, body requirement).

## AUTH header

- The `IWINV_API_KEY` is UTF-8 base64-encoded into the `AUTH` header (raw key bytes → base64 string). Do not use `btoa`/`atob` shortcuts; use `Buffer.from(key, 'utf8').toString('base64')`.
- `--api-key` flag overrides the `IWINV_API_KEY` env var. Flag wins.

## Request shape

- **GET**: no `Content-Type`, no body. Respect this — sending a body on a GET will trip the server.
- **POST**: `Content-Type: application/json` and a body. Default to `{}` if no `--json`/`--file`/stdin was provided **and** the endpoint allows empty body; otherwise reject in CLI before reaching the client.

## Response handling

- Read response as **text first**, then attempt `JSON.parse`. On parse failure, keep the raw text. Callers (and the API contract) rely on this two-step shape.
- Non-2xx → throw `ApiError(status, body)` with the parsed body (or raw text). Do not throw plain `Error` for API failures.

## Dry-run

- `buildDryRun` returns the **outgoing request** (method, URL, headers, body) without calling `fetch`. It must mirror the real request 1:1 — when in doubt, refactor to share a builder.
- Coverage requires that the dry-run path is exercised even when the live path is also tested.

## Things to watch out for

- The error messages mention **Node 26 fetch behavior**, but `engines.node` is `>=22`. If you change those messages, reconcile the version claim with [package.json](../package.json).
- The `endpoints` table is `Object.freeze`-d with `satisfies Record<...>`. Don't loosen it.
- `noUncheckedIndexedAccess` is on → index access into headers / `endpoints` is `T | undefined`. Narrow before use.
