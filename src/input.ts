import { readFile } from 'node:fs/promises';

export type JsonInputStdin = AsyncIterable<string | Buffer> & {
  isTTY?: boolean;
  setEncoding?: (encoding: BufferEncoding) => unknown;
};

type ReadJsonBodyOptions = {
  json?: string | undefined;
  file?: string | undefined;
  stdin?: JsonInputStdin | undefined;
};

export async function readJsonBody({ json, file, stdin = process.stdin }: ReadJsonBodyOptions = {}): Promise<unknown> {
  const sources = [json !== undefined, file !== undefined].filter(Boolean).length;
  if (sources > 1) throw new Error('Use only one body source: --json, --file, or stdin.');

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
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON body: ${message}`);
  }
}

async function readStdin(stdin: JsonInputStdin): Promise<string> {
  if (stdin.isTTY) return '';
  stdin.setEncoding?.('utf8');
  let text = '';
  for await (const chunk of stdin) text += chunk.toString();
  return text;
}
