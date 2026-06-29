import { Writable, Readable } from 'node:stream';
import test from 'node:test';
import assert from 'node:assert/strict';
import { main, parseArgs, resolveCommand } from '../src/cli.js';
import { DRY_RUN_PLACEHOLDER } from '../src/client.js';
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
  assert.equal(output.headers.AUTH.includes(DRY_RUN_PLACEHOLDER), false);
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

test('parseArgs reads -h short flag and the --file value, ignoring holes', () => {
  assert.equal(parseArgs(['-h']).help, true);
  assert.equal(parseArgs(['template', 'add', '--file', 'body.json']).file, 'body.json');
  assert.deepEqual(parseArgs(['charge', undefined as unknown as string]).positionals, ['charge']);
});

test('parseArgs rejects unknown options', () => {
  assert.throws(() => parseArgs(['--bogus']), /Unknown option: --bogus/);
});

test('parseArgs rejects a missing option value', () => {
  assert.throws(() => parseArgs(['--api-key']), /Missing value for --api-key/);
  assert.throws(() => parseArgs(['--json', '--pretty']), /Missing value for --json/);
});

test('parseArgs rejects combining --json and --file', () => {
  assert.throws(() => parseArgs(['send', '--json', '{}', '--file', 'body.json']), /only one body source/);
});

test('parseArgs accepts --help alone in any position', () => {
  assert.equal(parseArgs(['--help']).help, true);
  assert.equal(parseArgs(['-h']).help, true);
  assert.equal(parseArgs(['--help', '-h']).help, true);
  assert.equal(parseArgs(['-h', '--help']).help, true);
});

test('parseArgs rejects --help combined with other arguments', () => {
  // Command + help
  assert.throws(() => parseArgs(['send', '--help']), /--help must be used alone/);
  assert.throws(() => parseArgs(['--help', 'send']), /--help must be used alone/);
  // Help + other flags
  assert.throws(() => parseArgs(['--help', '--pretty']), /--help must be used alone/);
  assert.throws(() => parseArgs(['--pretty', '--help']), /--help must be used alone/);
  assert.throws(() => parseArgs(['--help', '--dry-run']), /--help must be used alone/);
  assert.throws(() => parseArgs(['--help', '--api-key', 'k']), /--help must be used alone/);
  assert.throws(() => parseArgs(['--api-key', 'k', '--help']), /--help must be used alone/);
  assert.throws(() => parseArgs(['--help', '--json', '{}']), /--help must be used alone/);
  assert.throws(() => parseArgs(['--help', '--file', 'body.json']), /--help must be used alone/);
});

test('main hides malformed inputs behind --help is rejected by parseArgs', async () => {
  // The previous behavior would print help and return 0 even when --json
  // had a bad value. Now the parse error must surface so the user sees it.
  const stdout = memoryWritable();
  const stderr = memoryWritable();
  const code = await main(['--help', '--json', '{bad'], {
    stdout: stdout.stream,
    stderr: stderr.stream,
    stdin: emptyTtyStdin(),
    env: {}
  });

  assert.equal(code, 1);
  assert.equal(stdout.output(), '');
  assert.match(stderr.output(), /--help must be used alone/);
});

test('resolveCommand reports every malformed command shape', () => {
  assert.throws(() => resolveCommand([]), /Missing command/);
  assert.throws(() => resolveCommand(['template']), /Missing template subcommand/);
  assert.throws(() => resolveCommand(['template', 'list', 'extra']), /Unexpected argument: extra/);
  assert.throws(() => resolveCommand(['template', 'bogus']), /Unknown template subcommand: bogus/);
  assert.throws(() => resolveCommand(['charge', 'extra']), /Unexpected argument: extra/);
  assert.throws(() => resolveCommand(['bogus']), /Unknown command: bogus/);
  assert.throws(() => resolveCommand(['template', 'list', undefined as unknown as string]), /Unexpected argument:/);
});

test('main returns 1 and writes the error to stderr on failure', async () => {
  const stdout = memoryWritable();
  const stderr = memoryWritable();
  const code = await main(['bogus'], { stdout: stdout.stream, stderr: stderr.stream, stdin: emptyTtyStdin(), env: {} });

  assert.equal(code, 1);
  assert.equal(stdout.output(), '');
  assert.match(stderr.output(), /Unknown command: bogus/);
  assert.match(stderr.output(), /Run with --help for usage/);
});

test('main falls back to the environment key and default base URL, printing raw text output', async () => {
  const stdout = memoryWritable();
  const stderr = memoryWritable();
  const calls: RequestInit[] = [];
  const fetchImpl: FetchLike = async (_url, init) => {
    calls.push(init ?? {});
    return new Response('plain text', { status: 200 });
  };

  const code = await main(['charge'], {
    stdout: stdout.stream,
    stderr: stderr.stream,
    stdin: emptyTtyStdin(),
    env: { IWINV_ALIMTALK_API_KEY: 'env-key' },
    fetchImpl
  });

  assert.equal(code, 0);
  assert.equal(headerValue(calls[0], 'AUTH'), Buffer.from('env-key').toString('base64'));
  assert.equal(stdout.output(), 'plain text\n');
  assert.equal(stderr.output(), '');
});

test('main stringifies a non-Error thrown during the request', async () => {
  const stdout = memoryWritable();
  const stderr = memoryWritable();
  const code = await main(['charge', '--api-key', 'k'], {
    stdout: stdout.stream,
    stderr: stderr.stream,
    stdin: emptyTtyStdin(),
    env: { IWINV_ALIMTALK_BASE_URL: 'https://mock.example' },
    fetchImpl: async () => {
      throw 'network down';
    }
  });

  assert.equal(code, 1);
  assert.match(stderr.output(), /network down/);
});

test('main falls back to process streams, env, and stdin when no IO is supplied', async () => {
  // Calling main() with no IO mirrors how bin.ts invokes it, exercising every
  // `io.x ?? process.x` default. --dry-run avoids the network and --json avoids
  // reading the real stdin; process.stdout is captured to keep test output clean.
  const originalWrite = process.stdout.write.bind(process.stdout);
  let out = '';
  process.stdout.write = ((chunk: string | Uint8Array) => {
    out += chunk.toString();
    return true;
  }) as typeof process.stdout.write;

  try {
    const code = await main(['send', '--json', '{"list":[]}', '--dry-run']);
    assert.equal(code, 0);
    assert.match(out, /api\/v2\/send\//);
  } finally {
    process.stdout.write = originalWrite;
  }
});

test('main uses the global fetch when no implementation is injected', async () => {
  const stdout = memoryWritable();
  const stderr = memoryWritable();
  const originalFetch = globalThis.fetch;
  let used = false;
  globalThis.fetch = (async () => {
    used = true;
    return new Response('{"code":200}', { status: 200 });
  }) as typeof globalThis.fetch;

  try {
    const code = await main(['charge', '--api-key', 'k'], {
      stdout: stdout.stream,
      stderr: stderr.stream,
      stdin: emptyTtyStdin(),
      env: { IWINV_ALIMTALK_BASE_URL: 'https://mock.example' }
    });
    assert.equal(code, 0);
    assert.equal(used, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
