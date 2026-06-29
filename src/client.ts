const DEFAULT_BASE_URL = 'https://alimtalk.bizservice.iwinv.kr';
const JSON_CONTENT_TYPE = 'application/json;charset=UTF-8';

/**
 * Stable placeholder substituted for the API key in dry-run output.
 *
 * The literal value is intentionally not exposed in error messages or help
 * text so that the redacted AUTH header is the only place it appears.
 */
export const DRY_RUN_PLACEHOLDER = 'dry-run-api-key';

type HttpMethod = 'GET' | 'POST';

type Endpoint = {
  method: HttpMethod;
  path: string;
  body: boolean;
};

export const endpoints = Object.freeze({
  send: { method: 'POST', path: '/api/v2/send/', body: true },
  'template list': { method: 'POST', path: '/api/template/', body: true },
  'template add': { method: 'POST', path: '/api/template/add/', body: true },
  'template modify': { method: 'POST', path: '/api/template/modify/', body: true },
  'template delete': { method: 'POST', path: '/api/template/delete/', body: true },
  history: { method: 'POST', path: '/api/history/', body: true },
  cancel: { method: 'POST', path: '/api/cancel/', body: true },
  charge: { method: 'GET', path: '/api/charge/', body: false }
} satisfies Record<string, Endpoint>);

export type Command = keyof typeof endpoints;

type Env = {
  IWINV_ALIMTALK_BASE_URL?: string | undefined;
};

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type RequestApiOptions = {
  command: Command;
  body?: unknown;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
  fetchImpl?: FetchLike | undefined;
};

type DryRunOptions = {
  command: Command;
  body?: unknown;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
};

type DryRunRequest = {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
};

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly body: unknown;

  constructor(message: string, { status, body }: { status?: number; body?: unknown } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function encodeAuth(apiKey: string): string {
  return Buffer.from(apiKey, 'utf8').toString('base64');
}

export function redactAuth(authValue: string): string {
  if (!authValue) return '<missing>';
  if (authValue.length <= 8) return '<redacted>';
  return `${authValue.slice(0, 4)}...${authValue.slice(-4)}`;
}

export function resolveBaseUrl(env: Env = process.env): string {
  return env.IWINV_ALIMTALK_BASE_URL || DEFAULT_BASE_URL;
}

export function buildUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

export function buildHeaders(apiKey: string, hasJsonBody: boolean): Record<string, string> {
  const headers: Record<string, string> = { AUTH: encodeAuth(apiKey) };
  if (hasJsonBody) headers['Content-Type'] = JSON_CONTENT_TYPE;
  return headers;
}

export async function requestApi({
  command,
  body,
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = globalThis.fetch
}: RequestApiOptions): Promise<unknown> {
  const endpoint = endpoints[command];
  if (!apiKey) throw new Error('Missing API key. Use --api-key or IWINV_ALIMTALK_API_KEY.');
  if (typeof fetchImpl !== 'function')
    throw new Error('fetch is not available. Node 22+ built-in fetch is required.');

  const hasJsonBody = endpoint.method !== 'GET';
  const init: RequestInit = {
    method: endpoint.method,
    headers: buildHeaders(apiKey, hasJsonBody)
  };
  if (hasJsonBody) init.body = JSON.stringify(body ?? {});
  const response = await fetchImpl(buildUrl(baseUrl, endpoint.path), init);

  const text = await response.text();
  const parsed = parseResponseBody(text);
  if (!response.ok) {
    throw new ApiError(`API request failed with HTTP ${response.status}`, {
      status: response.status,
      body: parsed
    });
  }
  return parsed;
}

export function buildDryRun({
  command,
  body,
  apiKey,
  baseUrl = DEFAULT_BASE_URL
}: DryRunOptions): DryRunRequest {
  const endpoint = endpoints[command];
  const hasJsonBody = endpoint.method !== 'GET';
  // Callers must supply an explicit apiKey (or omit, which uses the
  // placeholder). We deliberately do NOT fall back on empty strings:
  // a missing key in a dry-run means "show what the request would look
  // like", not "send an empty AUTH header".
  const key = apiKey && apiKey.length > 0 ? apiKey : DRY_RUN_PLACEHOLDER;
  const auth = encodeAuth(key);
  const headers: Record<string, string> = { AUTH: redactAuth(auth) };
  if (hasJsonBody) headers['Content-Type'] = JSON_CONTENT_TYPE;
  return {
    method: endpoint.method,
    url: buildUrl(baseUrl, endpoint.path),
    headers,
    body: hasJsonBody ? (body ?? {}) : undefined
  };
}

function parseResponseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
