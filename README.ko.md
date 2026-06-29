# iwinv 알림톡 CLI

iwinv 알림톡 API를 사용하기 위한 의존성 없는 Node 22+ ESM 기반 라이브러리이자 CLI입니다.

## 설치

Node.js 22 이상이 필요합니다.

### CLI로 사용

```sh
npm install -g @caor/iwinv-alimtalk
iwinv-alimtalk --help
```

설치하지 않고 실행하려면:

```sh
npx @caor/iwinv-alimtalk --help
```

### 라이브러리로 사용

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

## 환경 변수

- `IWINV_ALIMTALK_API_KEY`: `--api-key`를 전달하지 않았을 때 `AUTH` 헤더에 사용할 API 키입니다.
- `IWINV_ALIMTALK_BASE_URL`: 로컬 mock 서버나 테스트용으로 API 기본 URL을 바꿀 때 사용합니다. 기본값은 `https://alimtalk.bizservice.iwinv.kr`입니다.

`--api-key` 옵션은 `IWINV_ALIMTALK_API_KEY`보다 우선합니다.

`IWINV_ALIMTALK_API_KEY`에는 발급받은 API 키 원문을 그대로 설정하세요. 미리 base64 인코딩하거나 해싱하지 마세요. CLI가 요청을 보낼 때 원문 키를 내부에서 base64 인코딩한 뒤 `AUTH` 헤더에 넣습니다. Base64는 해싱이 아니라 인코딩이므로 이 값도 비밀로 관리해야 합니다.

## 명령어

모든 API 요청은 iwinv `AUTH` 헤더에 `base64_encode(API Key)` 값을 사용합니다. JSON 요청은 `Content-Type: application/json;charset=UTF-8`을 사용합니다.

| 명령어            | Method | Endpoint                | Body |
| ----------------- | ------ | ----------------------- | ---- |
| `send`            | `POST` | `/api/v2/send/`         | JSON |
| `template list`   | `POST` | `/api/template/`        | JSON |
| `template add`    | `POST` | `/api/template/add/`    | JSON |
| `template modify` | `POST` | `/api/template/modify/` | JSON |
| `template delete` | `POST` | `/api/template/delete/` | JSON |
| `history`         | `POST` | `/api/history/`         | JSON |
| `cancel`          | `POST` | `/api/cancel/`          | JSON |
| `charge`          | `GET`  | `/api/charge/`          | 없음 |

## JSON Body 입력

요청 body가 필요한 명령은 `--json`, `--file`, stdin 중 하나에서만 JSON을 입력받습니다. CLI는 입력받은 JSON 객체를 변경하지 않고 그대로 전달합니다.

### 인라인 JSON

```sh
iwinv-alimtalk send \
  --api-key "$IWINV_ALIMTALK_API_KEY" \
  --json '{"templateCode":"10030","list":[{"phone":"01012341234","templateParam":["홍길동"]}]}'
```

### 파일 JSON

```sh
iwinv-alimtalk template add --file template-add.json --pretty
```

`template-add.json` 예시:

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

### stdin JSON

```sh
printf '{"pageNum":"1","pageSize":"10"}' | iwinv-alimtalk template list --pretty
```

## 예시

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

`--dry-run`은 네트워크 요청을 보내지 않고 method, URL, 마스킹된 `AUTH` 헤더, content type, request body를 출력합니다. 실제 API 키가 없어도 사용할 수 있습니다.

```sh
iwinv-alimtalk send \
  --json '{"templateCode":"10030","list":[]}' \
  --dry-run \
  --pretty
```

Dry-run 출력은 base64 `AUTH` 값을 마스킹하며 원본 API 키를 출력하지 않습니다.

## Live API 안전장치

테스트와 smoke check는 injected 또는 mocked `fetch`를 사용해야 하며 실제 iwinv API를 호출하면 안 됩니다. 수동 테스트를 할 때는 먼저 `--dry-run`을 사용하거나 `IWINV_ALIMTALK_BASE_URL`을 로컬 mock 서버로 지정하세요. 실제 API 요청을 의도한 경우에만 `--dry-run`을 제거하세요.

## 개발

소스는 `src/` 아래의 strict TypeScript이며 테스트는 `test/` 아래의 TypeScript입니다. 빌드 결과는 `dist/`에 생성되며, CLI 진입점은 `dist/src/bin.js`, 라이브러리 진입점은 `dist/src/index.js`입니다.

소스에서 빌드해 실행하려면:

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

`npm test`는 TypeScript 빌드를 먼저 실행한 뒤 `dist/test`의 컴파일된 테스트를 실행합니다. `npm run test:coverage`는 추가로 `src/`에 대해 라인·브랜치·함수 100% 커버리지를 강제합니다(Node 22.8+ 필요). 이 패키지는 런타임 의존성이 없으며 Node 내장 `node:test`, `assert`, `fetch`, `Buffer` API를 사용합니다.
