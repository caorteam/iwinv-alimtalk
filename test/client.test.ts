import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDryRun, buildHeaders, encodeAuth, requestApi } from '../src/client.js';

type FetchCall = {
  url: string | URL | Request;
  init: RequestInit | undefined;
};

type FetchLike = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

function headerValue(init: RequestInit | undefined, name: string): string | undefined {
  if (!init?.headers || init.headers instanceof Headers || Array.isArray(init.headers)) return undefined;
  return init.headers[name];
}

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

  const result = await requestApi({ command: 'charge', apiKey: 'secret', baseUrl: 'http://localhost:3000', fetchImpl });

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
  assert.equal(auth.includes('dry-run-api-key'), false);
  assert.equal(auth.includes(Buffer.from('dry-run-api-key').toString('base64')), false);
  assert.equal(result.headers['Content-Type'], 'application/json;charset=UTF-8');
  assert.deepEqual(result.body, { templateCode: '10030' });
});
