/**
 * Shared error message for multiple body sources.
 *
 * Defined once so that both `cli.ts` (parse-time guard) and
 * `input.ts` (defense-in-depth) use the identical string,
 * and anyone adding new source flags doesn't need to hunt for
 * duplicate copies.
 */
export const BODY_SOURCE_ERROR = 'Use only one body source: --json, --file, or stdin.';

/**
 * Normalise an `unknown` thrown value into a printable string.
 *
 * Errors conventionally carry a `.message` property.  Anything
 * else (primitives, objects without `.message`) is serialised
 * via `String()` so callers don't have to repeat the
 * `instanceof` check everywhere.
 */
export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
