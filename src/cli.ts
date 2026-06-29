import type { Writable } from 'node:stream';
import type { Command } from './client.js';
import { buildDryRun, endpoints, requestApi, resolveBaseUrl } from './client.js';
import type { JsonInputStdin } from './input.js';
import { readJsonBody } from './input.js';

const helpText = `iwinv-alimtalk - iwinv Alimtalk API CLI

Usage:
  iwinv-alimtalk [global options] <command> [command] [body options]

Commands:
  send                 POST /api/v2/send/
  template list        POST /api/template/
  template add         POST /api/template/add/
  template modify      POST /api/template/modify/
  template delete      POST /api/template/delete/
  history              POST /api/history/
  cancel               POST /api/cancel/
  charge               GET  /api/charge/

Global options:
  --api-key <key>      API key. Overrides IWINV_ALIMTALK_API_KEY.
  --json '<json>'      JSON request body.
  --file <path>        Read JSON request body from a file.
  --dry-run            Print request details without sending a network request.
  --pretty             Pretty-print JSON output.
  --help, -h           Show this help.

Environment:
  IWINV_ALIMTALK_API_KEY   API key used when --api-key is omitted.
  IWINV_ALIMTALK_BASE_URL  Override the API base URL for tests or mocks.

Examples:
  iwinv-alimtalk charge --api-key "$IWINV_ALIMTALK_API_KEY" --pretty
  iwinv-alimtalk send --json '{"templateCode":"10030","list":[{"phone":"01012341234","templateParam":["A"]}]}'
  iwinv-alimtalk template list --json '{"pageNum":"1","pageSize":"10"}' --pretty
  iwinv-alimtalk template add --file template.json
  cat history.json | iwinv-alimtalk history --pretty
  iwinv-alimtalk send --json '{"templateCode":"10030","list":[]}' --dry-run --pretty
`;

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type CliIo = {
  stdout?: Pick<Writable, 'write'>;
  stderr?: Pick<Writable, 'write'>;
  stdin?: JsonInputStdin;
  env?: NodeJS.ProcessEnv | undefined;
  fetchImpl?: FetchLike | undefined;
};

export type ParsedArgs = {
  positionals: string[];
  apiKey?: string | undefined;
  json?: string | undefined;
  file?: string | undefined;
  dryRun: boolean;
  pretty: boolean;
  help: boolean;
};

export async function main(argv: string[] = process.argv.slice(2), io: CliIo = {}): Promise<number> {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const env = io.env ?? process.env;

  try {
    const parsed = parseArgs(argv);
    if (parsed.help) {
      writeLine(stdout, helpText.trimEnd());
      return 0;
    }

    const command = resolveCommand(parsed.positionals);
    const endpoint = endpoints[command];
    const apiKey = parsed.apiKey ?? env.IWINV_ALIMTALK_API_KEY;
    const baseUrl = resolveBaseUrl(env);
    const body = endpoint.body ? await readJsonBody({ json: parsed.json, file: parsed.file, stdin: io.stdin ?? process.stdin }) : undefined;
    const result = parsed.dryRun
      ? buildDryRun({ command, body, apiKey, baseUrl })
      : await requestApi({ command, body, apiKey, baseUrl, fetchImpl: io.fetchImpl ?? globalThis.fetch });

    writeLine(stdout, formatOutput(result, parsed.pretty));
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    writeLine(stderr, `${message}\n\nRun with --help for usage.`);
    return 1;
  }
}

export function parseArgs(argv: string[]): ParsedArgs {
  const options: ParsedArgs = {
    positionals: [],
    dryRun: false,
    pretty: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === undefined) continue;
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--pretty') {
      options.pretty = true;
    } else if (arg === '--api-key') {
      options.apiKey = readOptionValue(argv, ++index, '--api-key');
    } else if (arg === '--json') {
      options.json = readOptionValue(argv, ++index, '--json');
    } else if (arg === '--file') {
      options.file = readOptionValue(argv, ++index, '--file');
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.positionals.push(arg);
    }
  }

  if (options.json !== undefined && options.file !== undefined) {
    throw new Error('Use only one body source: --json, --file, or stdin.');
  }

  // --help must be used alone. Mixing it with commands or other flags would
  // silently hide real errors (e.g. malformed --json), so we reject early.
  if (options.help && (options.positionals.length > 0 || options.apiKey !== undefined || options.json !== undefined || options.file !== undefined || options.dryRun || options.pretty)) {
    throw new Error('--help must be used alone; it cannot be combined with other arguments.');
  }
  return options;
}

export function resolveCommand(positionals: string[]): Command {
  const [first, second, ...extra] = positionals;
  if (!first) throw new Error('Missing command.');
  if (first === 'template') {
    if (!second) throw new Error('Missing template subcommand.');
    if (extra.length) throw new Error(`Unexpected argument: ${extra[0] ?? ''}`);
    const command = `template ${second}`;
    if (!isCommand(command)) throw new Error(`Unknown template subcommand: ${second}`);
    return command;
  }
  if (second) throw new Error(`Unexpected argument: ${second}`);
  if (!isCommand(first)) throw new Error(`Unknown command: ${first}`);
  return first;
}

function isCommand(command: string): command is Command {
  return Object.hasOwn(endpoints, command);
}

function readOptionValue(argv: string[], index: number, option: string): string {
  const value = argv[index];
  if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${option}.`);
  return value;
}

function formatOutput(value: unknown, pretty: boolean): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, pretty ? 2 : 0);
}

function writeLine(stream: Pick<Writable, 'write'>, text: string): void {
  stream.write(`${text}\n`);
}
