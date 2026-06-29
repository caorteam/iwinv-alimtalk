import type { JsonInputStdin } from '../src/input.js';
import type { FetchLike } from '../src/util.js';

import { Readable, Writable } from 'node:stream';

export function memoryWritable(): { stream: Writable; output: () => string } {
  let output = '';
  return {
    stream: new Writable({
      write(
        chunk: Buffer | string,
        _encoding: BufferEncoding,
        callback: (error?: Error | null) => void
      ) {
        output += chunk.toString();
        callback();
      }
    }),
    output: () => output
  };
}

export function emptyTtyStdin(): JsonInputStdin {
  return Object.assign(Readable.from([]), { isTTY: true });
}

export function headerValue(init: RequestInit | undefined, name: string): string | undefined {
  if (!init?.headers || init.headers instanceof Headers || Array.isArray(init.headers))
    return undefined;
  return init.headers[name];
}

export function fetchRecorder(responseFactory?: () => Response): {
  fetchImpl: FetchLike;
  calls: Array<{ url: string | URL | Request; init: RequestInit | undefined }>;
} {
  const calls: Array<{ url: string | URL | Request; init: RequestInit | undefined }> = [];
  const factory = responseFactory ?? (() => new Response('{"code":200}', { status: 200 }));
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return factory();
  };
  return { fetchImpl, calls };
}
