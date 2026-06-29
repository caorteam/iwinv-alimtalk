import type { JsonInputStdin } from '../src/input.js';

import { Readable } from 'node:stream';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { readJsonBody } from '../src/input.js';

function readableStdin(chunks: string[], isTTY: boolean): JsonInputStdin {
  return Object.assign(Readable.from(chunks), { isTTY });
}

test('reads body from --json', async () => {
  assert.deepEqual(await readJsonBody({ json: '{"pageNum":"1"}' }), { pageNum: '1' });
});

test('reads body from stdin when no explicit source is supplied', async () => {
  const stdin = readableStdin(['{"seqNo":"11"}'], false);
  assert.deepEqual(await readJsonBody({ stdin }), { seqNo: '11' });
});

test('returns empty object for TTY stdin with no body', async () => {
  const stdin = readableStdin([], true);
  assert.deepEqual(await readJsonBody({ stdin }), {});
});

test('rejects invalid JSON', async () => {
  await assert.rejects(() => readJsonBody({ json: '{bad' }), /Invalid JSON body/);
});

test('reads body from a file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'iwinv-alimtalk-'));
  const file = join(dir, 'body.json');
  try {
    await writeFile(file, '{"templateCode":"10030"}', 'utf8');
    assert.deepEqual(await readJsonBody({ file }), { templateCode: '10030' });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects when more than one body source is supplied', async () => {
  await assert.rejects(
    () => readJsonBody({ json: '{}', file: 'body.json' }),
    /only one body source/
  );
});

test('reads stdin that does not expose setEncoding', async () => {
  const stdin: JsonInputStdin = {
    isTTY: false,
    async *[Symbol.asyncIterator]() {
      yield '{"seqNo":';
      yield '"7"}';
    }
  };
  assert.deepEqual(await readJsonBody({ stdin }), { seqNo: '7' });
});

test('returns empty object for blank stdin content', async () => {
  const stdin = readableStdin(['   \n'], false);
  assert.deepEqual(await readJsonBody({ stdin }), {});
});
