# iwinv Alimtalk CLI

Dependency-free Node 22+ ESM library and CLI for the iwinv Alimtalk API.

## Install

Requires Node.js 22 or newer.

### As a CLI

```sh
npm install -g @caor/iwinv-alimtalk
iwinv-alimtalk --help
```

Or run it without installing:

```sh
npx @caor/iwinv-alimtalk --help
```

### As a library

```sh
npm install @caor/iwinv-alimtalk
```

```js
import { requestApi, ApiError } from '@caor/iwinv-alimtalk';

try {
  const result = await requestApi({
    command: 'send',
    apiKey: process.env.IWINV_ALIMTALK_API_KEY,
    body: { templateCode: '10030', list: [{ phone: '01012341234', templateParam: ['홍길동'] }] }
  });
  console.log(result);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.status, error.body);
  }
}
```

## Environment Variables

- `IWINV_ALIMTALK_API_KEY`: API key used for the `AUTH` header when `--api-key` is not provided.
- `IWINV_ALIMTALK_BASE_URL`: Optional base URL override for local mocks or tests. Defaults to `https://alimtalk.bizservice.iwinv.kr`.

`--api-key` takes precedence over `IWINV_ALIMTALK_API_KEY`.

Set `IWINV_ALIMTALK_API_KEY` to the raw API key exactly as issued. Do not pre-encode or hash it. The CLI base64-encodes the raw key internally before sending the `AUTH` header. Base64 is encoding, not hashing, so treat the value as a secret.

## Commands

All API requests use the iwinv `AUTH` header as `base64_encode(API Key)`. JSON requests use `Content-Type: application/json;charset=UTF-8`.

| Command           | Method | Endpoint                | Body |
| ----------------- | ------ | ----------------------- | ---- |
| `send`            | `POST` | `/api/v2/send/`         | JSON |
| `template list`   | `POST` | `/api/template/`        | JSON |
| `template add`    | `POST` | `/api/template/add/`    | JSON |
| `template modify` | `POST` | `/api/template/modify/` | JSON |
| `template delete` | `POST` | `/api/template/delete/` | JSON |
| `history`         | `POST` | `/api/history/`         | JSON |
| `cancel`          | `POST` | `/api/cancel/`          | JSON |
| `charge`          | `GET`  | `/api/charge/`          | none |

## JSON Body Input

Commands that need a request body accept JSON from exactly one source: `--json`, `--file`, or stdin. The CLI passes the JSON object through unchanged.

### Inline JSON

```sh
iwinv-alimtalk send \
  --api-key "$IWINV_ALIMTALK_API_KEY" \
  --json '{"templateCode":"10030","list":[{"phone":"01012341234","templateParam":["홍길동"]}]}'
```

### File JSON

```sh
iwinv-alimtalk template add --file template-add.json --pretty
```

Example `template-add.json`:

```json
{
  "templateName": "템플릿명",
  "templateContent": "안녕하세요 #{name}님",
  "buttons": [
    {
      "type": "WL",
      "name": "웹링크",
      "linkPc": "https://www.iwinv.kr/",
      "linkMo": "https://www.iwinv.kr/"
    }
  ]
}
```

### Stdin JSON

```sh
printf '{"pageNum":"1","pageSize":"10"}' | iwinv-alimtalk template list --pretty
```

## Examples

```sh
iwinv-alimtalk charge --pretty
```

```sh
iwinv-alimtalk template list --json '{"pageNum":"1","pageSize":"10"}' --pretty
```

```sh
iwinv-alimtalk template modify --file template-modify.json
```

```sh
iwinv-alimtalk template delete --json '{"templateCode":"10030"}'
```

```sh
iwinv-alimtalk history --json '{"pageNum":"1","pageSize":"10","startDate":"2021-06-07"}' --pretty
```

```sh
iwinv-alimtalk cancel --json '{"seqNo":"11"}'
```

## Dry Run

`--dry-run` prints the method, URL, redacted `AUTH` header, content type, and request body without making a network call. It does not require a real API key.

```sh
iwinv-alimtalk send \
  --json '{"templateCode":"10030","list":[]}' \
  --dry-run \
  --pretty
```

Dry-run output redacts the base64 `AUTH` value and never prints the raw API key.

## Live API Safety

Tests and smoke checks should use injected or mocked `fetch` and must not call the real iwinv API. For manual experiments, use `--dry-run` first or set `IWINV_ALIMTALK_BASE_URL` to a local mock server. Only remove `--dry-run` when you intentionally want to send a live API request.

## Development

The source is strict TypeScript under `src/` and tests are TypeScript under `test/`. Build output is emitted to `dist/`; the CLI entry point is `dist/src/bin.js` and the library entry point is `dist/src/index.js`.

To build and run from source:

```sh
npm install
npm run build
node ./dist/src/bin.js --help
```

```sh
npm test
```

```sh
npm run test:coverage
```

`npm test` runs the TypeScript build first, then executes the compiled tests from `dist/test`. `npm run test:coverage` additionally enforces 100% line, branch, and function coverage on `src/` (requires Node 22.8+). The package has no runtime dependencies and uses Node's built-in `node:test`, `assert`, `fetch`, and `Buffer` APIs.
