import { Writable, Readable } from 'node:stream';
import test from 'node:test';
import assert from 'node:assert/strict';
import { main, parseArgs, resolveCommand } from '../src/cli.js';
import type { JsonInputStdin } from '../src/input.js';

type FetchLike = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

function memoryWritable(): { stream: Writable; output: () => string } {
  let output = '';
  return {
    stream: new Writable({
      write(chunk: Buffer | string, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        output += chunk.toString();
        callback();
      }
    }),
    output: () => output
  };
}

function emptyTtyStdin(): JsonInputStdin {
  return Object.assign(Readable.from([]), { isTTY: true });
}

function headerValue(init: RequestInit | undefined, name: string): string | undefined {
  if (!init?.headers || init.headers instanceof Headers || Array.isArray(init.headers)) return undefined;
  return init.headers[name];
}

test('parses commands and options', () => {
  assert.deepEqual(parseArgs(['template', 'list', '--json', '{}', '--pretty']).positionals, ['template', 'list']);
  assert.equal(resolveCommand(['template', 'modify']), 'template modify');
  assert.equal(resolveCommand(['history']), 'history');
});

test('flag API key takes precedence over environment key', async () => {
  const stdout = memoryWritable();
  const stderr = memoryWritable();
  const calls: RequestInit[] = [];
  const fetchImpl: FetchLike = async (_url, init) => {
    calls.push(init ?? {});
    return new Response('{"code":200}', { status: 200 });
  };

  const code = await main(['charge', '--api-key', 'flag-key'], {
    stdout: stdout.stream,
    stderr: stderr.stream,
    stdin: emptyTtyStdin(),
    env: { IWINV_ALIMTALK_API_KEY: 'env-key', IWINV_ALIMTALK_BASE_URL: 'https://mock.example' },
    fetchImpl
  });

  assert.equal(code, 0);
  assert.equal(headerValue(calls[0], 'AUTH'), Buffer.from('flag-key').toString('base64'));
  assert.equal(stderr.output(), '');
});

test('dry-run does not call fetch and prints redacted request details', async () => {
  const stdout = memoryWritable();
  const stderr = memoryWritable();
  let called = false;

  const code = await main(['send', '--json', '{"templateCode":"10030","list":[]}', '--dry-run', '--pretty'], {
    stdout: stdout.stream,
    stderr: stderr.stream,
    stdin: emptyTtyStdin(),
    env: { IWINV_ALIMTALK_BASE_URL: 'https://mock.example' },
    fetchImpl: async () => {
      called = true;
      return new Response('{}');
    }
  });

  assert.equal(code, 0);
  assert.equal(called, false);
  const output = JSON.parse(stdout.output()) as {
    method: string;
    url: string;
    headers: { AUTH: string };
    body: unknown;
  };
  assert.equal(output.method, 'POST');
  assert.equal(output.url, 'https://mock.example/api/v2/send/');
  assert.equal(output.headers.AUTH.includes('dry-run-api-key'), false);
  assert.deepEqual(output.body, { templateCode: '10030', list: [] });
  assert.equal(stderr.output(), '');
});

test('help prints usage', async () => {
  const stdout = memoryWritable();
  const stderr = memoryWritable();
  const code = await main(['--help'], { stdout: stdout.stream, stderr: stderr.stream, stdin: emptyTtyStdin(), env: {} });

  assert.equal(code, 0);
  assert.match(stdout.output(), /Commands:/);
  assert.match(stdout.output(), /template delete/);
  assert.equal(stderr.output(), '');
});
