import { readFile } from 'node:fs/promises';

import { BODY_SOURCE_ERROR, toErrorMessage } from './util.js';

export type JsonInputStdin = AsyncIterable<string | Buffer> & {
  isTTY?: boolean;
  setEncoding?: (encoding: BufferEncoding) => unknown;
};

type ReadJsonBodyOptions = {
  json?: string | undefined;
  file?: string | undefined;
  stdin?: JsonInputStdin | undefined;
};

export async function readJsonBody({
  json,
  file,
  stdin = process.stdin
}: ReadJsonBodyOptions = {}): Promise<unknown> {
  const explicitSources = (json !== undefined ? 1 : 0) + (file !== undefined ? 1 : 0);
  if (explicitSources > 1) throw new Error(BODY_SOURCE_ERROR);

  let text: string;
  if (json !== undefined) {
    text = json;
  } else if (file !== undefined) {
    text = await readFile(file, 'utf8');
  } else {
    text = await readStdin(stdin);
  }

  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch (error: unknown) {
    throw new Error(`Invalid JSON body: ${toErrorMessage(error)}`);
  }
}

async function readStdin(stdin: JsonInputStdin): Promise<string> {
  if (stdin.isTTY) return '';
  stdin.setEncoding?.('utf8');
  let text = '';
  for await (const chunk of stdin) text += chunk.toString();
  return text;
}
