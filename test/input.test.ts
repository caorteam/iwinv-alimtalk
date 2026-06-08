import { Readable } from 'node:stream';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readJsonBody } from '../src/input.js';
import type { JsonInputStdin } from '../src/input.js';

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
