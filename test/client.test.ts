import type { FetchLike } from '../src/util.js';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ApiError,
  buildDryRun,
  buildHeaders,
  buildUrl,
  DRY_RUN_PLACEHOLDER,
  encodeAuth,
  redactAuth,
  requestApi,
  resolveBaseUrl
} from '../src/client.js';

import { headerValue } from './helpers.js';

type FetchCall = {
  url: string | URL | Request;
  init: RequestInit | undefined;
};

test('encodes AUTH as base64 utf8 API key', () => {
  assert.equal(encodeAuth('키-abc'), Buffer.from('키-abc', 'utf8').toString('base64'));
});

test('builds JSON request headers with required content type', () => {
  assert.deepEqual(buildHeaders('secret', true), {
    AUTH: 'c2VjcmV0',
    'Content-Type': 'application/json;charset=UTF-8'
  });
});

test('requestApi posts JSON body to selected endpoint with injected fetch', async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ code: 200, message: 'ok' }), { status: 200 });
  };

  const result = await requestApi({
    command: 'send',
    body: { templateCode: '10030', list: [] },
    apiKey: 'test-key',
    baseUrl: 'https://mock.example',
    fetchImpl
  });

  const call = calls[0];
  assert.deepEqual(result, { code: 200, message: 'ok' });
  assert.equal(calls.length, 1);
  assert.equal(call?.url, 'https://mock.example/api/v2/send/');
  assert.equal(call?.init?.method, 'POST');
  assert.equal(headerValue(call?.init, 'AUTH'), 'dGVzdC1rZXk=');
  assert.equal(headerValue(call?.init, 'Content-Type'), 'application/json;charset=UTF-8');
  assert.equal(call?.init?.body, JSON.stringify({ templateCode: '10030', list: [] }));
});

test('requestApi sends charge as GET without JSON content type or body', async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ code: 200, charge: 10000 }), { status: 200 });
  };

  const result = await requestApi({
    command: 'charge',
    apiKey: 'secret',
    baseUrl: 'http://localhost:3000',
    fetchImpl
  });

  const call = calls[0];
  assert.deepEqual(result, { code: 200, charge: 10000 });
  assert.equal(call?.url, 'http://localhost:3000/api/charge/');
  assert.equal(call?.init?.method, 'GET');
  assert.equal(headerValue(call?.init, 'AUTH'), 'c2VjcmV0');
  assert.equal(headerValue(call?.init, 'Content-Type'), undefined);
  assert.equal(call?.init?.body, undefined);
});

test('dry-run redacts auth and does not need a real key', () => {
  const result = buildDryRun({
    command: 'template delete',
    body: { templateCode: '10030' },
    baseUrl: 'https://mock.example'
  });

  const auth = result.headers.AUTH;
  if (auth === undefined) assert.fail('dry-run AUTH header missing');
  assert.equal(result.method, 'POST');
  assert.equal(result.url, 'https://mock.example/api/template/delete/');
  assert.equal(auth.includes(DRY_RUN_PLACEHOLDER), false);
  assert.equal(auth.includes(encodeAuth(DRY_RUN_PLACEHOLDER)), false);
  assert.equal(result.headers['Content-Type'], 'application/json;charset=UTF-8');
  assert.deepEqual(result.body, { templateCode: '10030' });
});

test('dry-run for GET command has no body or content type and tolerates empty key', () => {
  const result = buildDryRun({ command: 'charge', apiKey: '', baseUrl: 'https://mock.example' });

  assert.equal(result.method, 'GET');
  assert.equal(result.url, 'https://mock.example/api/charge/');
  assert.equal(result.body, undefined);
  assert.equal(result.headers['Content-Type'], undefined);
  assert.equal(result.headers.AUTH?.includes(DRY_RUN_PLACEHOLDER), false);
});

test('requestApi throws ApiError carrying status and parsed body on non-ok response', async () => {
  const fetchImpl: FetchLike = async () =>
    new Response(JSON.stringify({ code: 400, message: 'bad request' }), { status: 400 });

  await assert.rejects(
    () =>
      requestApi({
        command: 'send',
        body: {},
        apiKey: 'k',
        baseUrl: 'https://mock.example',
        fetchImpl
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 400);
      assert.deepEqual(error.body, { code: 400, message: 'bad request' });
      assert.match(error.message, /HTTP 400/);
      return true;
    }
  );
});

test('requestApi throws when API key is missing', async () => {
  const fetchImpl: FetchLike = async () => new Response('{}');
  await assert.rejects(
    () => requestApi({ command: 'charge', baseUrl: 'https://mock.example', fetchImpl }),
    /Missing API key/
  );
});

test('requestApi throws when fetch implementation is not a function', async () => {
  await assert.rejects(
    () =>
      requestApi({
        command: 'charge',
        apiKey: 'k',
        baseUrl: 'https://mock.example',
        fetchImpl: null as unknown as FetchLike
      }),
    /fetch is not available/
  );
});

test('requestApi defaults POST body to empty object when omitted', async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return new Response('{}', { status: 200 });
  };

  await requestApi({ command: 'send', apiKey: 'k', baseUrl: 'https://mock.example', fetchImpl });

  assert.equal(calls[0]?.init?.body, '{}');
});

test('requestApi returns null for an empty response body', async () => {
  const fetchImpl: FetchLike = async () => new Response('', { status: 200 });
  const result = await requestApi({
    command: 'charge',
    apiKey: 'k',
    baseUrl: 'https://mock.example',
    fetchImpl
  });
  assert.equal(result, null);
});

test('requestApi returns raw text when the response is not JSON', async () => {
  const fetchImpl: FetchLike = async () => new Response('plain text', { status: 200 });
  const result = await requestApi({
    command: 'charge',
    apiKey: 'k',
    baseUrl: 'https://mock.example',
    fetchImpl
  });
  assert.equal(result, 'plain text');
});

test('redactAuth covers missing, short, and long values', () => {
  assert.equal(redactAuth(''), '<missing>');
  assert.equal(redactAuth('12345678'), '<redacted>');
  assert.equal(redactAuth('123456789'), '1234...6789');
});

test('DRY_RUN_PLACEHOLDER is exported and never appears verbatim in AUTH headers', () => {
  // The placeholder is intentionally a private constant value. Tests must
  // not assume its exact content; instead, verify that whatever it is, it
  // never leaks into a redacted AUTH header.
  assert.equal(typeof DRY_RUN_PLACEHOLDER, 'string');
  assert.ok(DRY_RUN_PLACEHOLDER.length > 0);
  const placeholderAuth = encodeAuth(DRY_RUN_PLACEHOLDER);
  assert.equal(redactAuth(placeholderAuth).includes(DRY_RUN_PLACEHOLDER), false);
});

test('buildDryRun substitutes a placeholder when apiKey is omitted', () => {
  const result = buildDryRun({ command: 'send', body: {}, baseUrl: 'https://mock.example' });
  const auth = result.headers.AUTH;
  if (auth === undefined) assert.fail('AUTH header missing in dry-run output');
  // Header must be redacted — never the real placeholder base64.
  assert.notEqual(auth, encodeAuth(DRY_RUN_PLACEHOLDER));
  assert.equal(auth.includes('real-key'), false);
});

test('buildDryRun substitutes a placeholder when apiKey is an empty string', () => {
  const result = buildDryRun({
    command: 'send',
    body: {},
    apiKey: '',
    baseUrl: 'https://mock.example'
  });
  const auth = result.headers.AUTH;
  if (auth === undefined) assert.fail('AUTH header missing in dry-run output');
  // Even an explicit empty string must not leak through as an empty AUTH.
  assert.notEqual(auth, '');
  // The placeholder-driven header should match what we get with no key.
  const noKey = buildDryRun({ command: 'send', body: {}, baseUrl: 'https://mock.example' });
  assert.equal(auth, noKey.headers.AUTH);
});

test('buildDryRun redacts a caller-supplied real key the same way', () => {
  const realKey = 'this-is-a-real-secret-key-1234567890';
  const result = buildDryRun({
    command: 'send',
    body: {},
    apiKey: realKey,
    baseUrl: 'https://mock.example'
  });
  const auth = result.headers.AUTH;
  if (auth === undefined) assert.fail('AUTH header missing in dry-run output');
  // Real key bytes must never appear verbatim in the redacted header.
  assert.equal(auth.includes(realKey), false);
  assert.equal(auth.includes(encodeAuth(realKey)), false);
  // Long base64 gets the standard 4-char prefix/suffix redaction.
  const expected = redactAuth(encodeAuth(realKey));
  assert.equal(auth, expected);
});

test('buildHeaders omits content type when there is no JSON body', () => {
  assert.deepEqual(buildHeaders('secret', false), { AUTH: 'c2VjcmV0' });
});

test('resolveBaseUrl falls back to the default when no override is set', () => {
  assert.equal(resolveBaseUrl({}), 'https://alimtalk.bizservice.iwinv.kr');
  assert.equal(
    resolveBaseUrl({ IWINV_ALIMTALK_BASE_URL: 'https://override.example' }),
    'https://override.example'
  );
});

test('buildUrl normalizes base URLs with and without a trailing slash', () => {
  assert.equal(buildUrl('https://x.example', '/api/charge/'), 'https://x.example/api/charge/');
  assert.equal(buildUrl('https://x.example/', '/api/charge/'), 'https://x.example/api/charge/');
});

test('ApiError defaults status and body when constructed without details', () => {
  const error = new ApiError('boom');
  assert.equal(error.name, 'ApiError');
  assert.equal(error.status, undefined);
  assert.equal(error.body, undefined);
});

test('requestApi defaults the base URL and global fetch when both are omitted', async () => {
  const originalFetch = globalThis.fetch;
  const calls: (string | URL | Request)[] = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    calls.push(url);
    return new Response('{"code":200}', { status: 200 });
  }) as typeof globalThis.fetch;

  try {
    await requestApi({ command: 'charge', apiKey: 'k' });
    assert.match(String(calls[0]), /alimtalk\.bizservice\.iwinv\.kr\/api\/charge\//);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('buildDryRun defaults the base URL when none is provided', () => {
  const result = buildDryRun({ command: 'charge' });
  assert.match(result.url, /^https:\/\/alimtalk\.bizservice\.iwinv\.kr\/api\/charge\/$/);
});

test('buildDryRun defaults a POST body to an empty object when omitted', () => {
  const result = buildDryRun({ command: 'send', baseUrl: 'https://mock.example' });
  assert.deepEqual(result.body, {});
});
