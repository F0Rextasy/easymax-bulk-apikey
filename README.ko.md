<div align="center">

```
███████╗ █████╗ ███████╗██╗   ██╗███╗   ███╗ █████╗ ██╗  ██╗
██╔════╝██╔══██╗██╔════╝╚██╗ ██╔╝████╗ ████║██╔══██╗╚██╗██╔╝
█████╗  ███████║███████╗ ╚████╔╝ ██╔████╔██║███████║ ╚███╔╝
██╔══╝  ██╔══██║╚════██║  ╚██╔╝  ██║╚██╔╝██║██╔══██║ ██╔██╗
███████╗██║  ██║███████║   ██║   ██║ ╚═╝ ██║██║  ██║██╔╝ ██╗
╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
```

# easymax-bulk-apikey

**자동 생성된 API 키로 EasyMax 계정을 대량 생성 — OpenAI 호환 추론 (DeepSeek V4.1, DeepSeek V4 Pro, GPT-6 패밀리) + 9Router 커넥터.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://easymax.ai/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-5-of-them) · [🧪 API 사용하기](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 왜 이게 필요한가

EasyMax는 **평범한 사용자 이름 + 비밀번호 + 이메일 가입** (Turnstile 비활성화, 이메일 인증 없음)을 제공하는 New API 패널이며, 웰컴 쿼터는 **초대 코드**에서 나옵니다: 그냥 가입하면 `quota: 0`이 되어 키가 `403 用户额度不足`을 반환하지만, `aff_code`와 함께 등록하면 **계정당 250000 쿼터 (≈ $0.50)** 가 지급됩니다 — 2026-10-19에 측정된 값이며, 이 도구가 존재하는 이유입니다. 확장되는 단위는 *키당 하나의 계정*이며, 이 도구는 이를 `keys.txt`로 만들어 줍니다. 여기서 **모든 줄이 실제 채팅 호출을 통과했고**, 계정당 하나의 고정 프록시 출구를 사용하며, 메일박스는 자체 인박스 레일에서 가져옵니다.

## 🎁 무료 티어 — 얼마나 받을 수 있나

**모든 계정은 가입 시 보내는 초대 코드로 충전됩니다** — 이것이 무료 티어의 전부입니다.

| 항목 | 값 |
| --- | --- |
| 웰컴 쿼터 | 계정당 **250000** (≈ $0.50), 키의 그룹에서 토큰당 차감 |
| 출처 | `POST /api/user/register?turnstile=` 에 `aff_code=<code>` 포함 |
| 초대 코드 없이 | `quota: 0` → 키가 모든 유료 모델에서 `403 用户额度不足` 반환 |
| 카드 필요 | **아니오** |
| 캡차 | **없음** — 가입 및 로그인에서 Turnstile 비활성화 (`?turnstile=` 는 빈 값을 허용) |
| 이메일 인증 | **불필요** — 패널은 주소만 저장하고 코드를 보내지 않음 |
| 확장되는 단위 | **계정 하나 = 키 하나** → `--count N`은 사실상 "충전된 계정 N개" |

`--aff`는 기본적으로 이 플릿의 자체 초대 코드를 사용합니다. 자신의 코드로 지정하면 생성하는 모든 계정이 패널 수수료 (이 패널은 10 %)를 적립해 줍니다.

> 💡 무료 티어는 EasyMax가 정하며 변경될 수 있습니다. 실시간 수치는 [easymax.ai](https://easymax.ai)에서 확인하세요 — 그리고 도구 자체의 게이트가 판단하게 하세요:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 모델 — 5개 전부

패널의 카탈로그에는 그룹별로 나뉜 **101개의 모델 ID** (`GET /api/pricing`)가 있습니다. **생성하는 토큰 그룹이 키가 제공할 수 있는 것을 결정합니다**. 아래 체크된 ID들은 새로 생성한 계정에서 실제 채팅 호출로 실행되었습니다:

| 모델 ID | 토큰 그룹 | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (기본) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models`는 정확히 해당 그룹의 목록을 반환합니다: `deepseek` 그룹 키는 **2개 ID**, `default` 그룹 키는 **14개 ID** (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). 이 레일은 기본적으로 `--group deepseek`을 생성합니다. 그 ID들이 토큰당 가장 저렴해서 250000 쿼터 계정이 그것들에서 가장 오래가기 때문입니다. 대신 해당 패밀리의 키를 생성하려면 `--group default` (또는 패널이 노출하는 다른 그룹 이름)를 전달하세요.

## 🧪 API 사용 방법

베이스 URL은 **`https://easymax.ai/v1`** 입니다 — OpenAI 호환이므로 OpenAI를 지원하는 모든 것 (SDK, Cursor, OpenCode, Kilo Code, …)이 작동합니다.

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

`deepseek-v4-pro` ID는 추론 모델입니다: 먼저 `reasoning_content`로 답하고 사고 예산 이후에만 `content`를 반환하므로, `max_tokens`를 100보다 훨씬 크게 설정하지 않으면 빈 `content`를 보게 됩니다.

## 🛠 빠른 시작

```bash

# clone or fork this repository, then:
cd easymax-bulk-apikey

# 1) your proxy list, one per line (http://…, socks5://… or socks4a://…)
printf 'http://127.0.0.1:8080\n' > proxies.txt

# 2) go
node src/launcher.js        # interactive

# or directly:
node src/cli.js --count 50
```

키는 실제 채팅 완성이 증명한 **후에만** `keys.txt`에 추가됩니다. 그 지점에 도달하지 못한 계정은 `accounts.json`에 기록되고 다음 실행에서 재시도됩니다.

### 🖱️ 런처

런처는 프록시 목록, 개수, 검증 모델을 묻고 이를 `launcher.config.json`에 기억한 뒤 올바른 플래그로 CLI를 실행합니다.

## ✅ 검증됨 — 모든 키가 테스트됨

| 확인 | 결과 |
| --- | --- |
| register `POST /api/user/register?turnstile=` | **200** `{"success":true}` — `aff_code`와 함께면 계정이 `quota: 250000`에 도달 |
| login `POST /api/user/login?turnstile=` | **200** — New-API **v2** 페이로드 (`access_token` JWT + 세션) |
| auth | `/api/token/*` 에서 `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` |
| key | `POST /api/token/ {group}` → **200**, 그런 다음 `POST /api/token/<id>/key` → 전체 키 |
| chat gate — 작성되기 전 **모든** 키에 대해 실행 | 실제 콘텐츠와 함께 **200** |
| 채팅 확인에 실패한 키 | `keys.txt`에 절대 기록되지 않음 (계정은 `accounts.json`에서 재사용 가능) |

빌드 중 이 도구로 생성됨: **8개 계정 / 8개 키, 모두 `quota 250000`, 모두 `deepseek-v4.1-flash`에서 chat-200**, 두 가지 터널 유형 (CONNECT + SOCKS5)과 4개 출구에 걸쳐.

## 🧭 작동 방식

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| 단계 | 호출 | 비고 |
| --- | --- | --- |
| mailbox | broker `POST /create` → emailnator → 생성된 주소 | 패널은 주소만 저장하며, 레일은 메일에서 절대 차단되지 않음 |
| register | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | 초대 코드가 계정을 충전하는 것 |
| login | `POST /api/user/login?turnstile= {username,password}` | 본문에 `access_token` 반환 |
| account | `GET /api/user/self` | `id` (→ `New-Api-User`)와 초대가 작동했음을 증명하는 `quota` 제공 |
| key | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | 평문 키가 한 번 반환됨 |
| check | `POST /v1/chat/completions` | `keys.txt` 이전에 실제 200 필요 |

## ⚙️ CLI 옵션

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| 플래그 | 기본값 | 의미 |
| --- | --- | --- |
| `--count` | 5 | 생성할 계정 (= 키) 수 |
| `--conc` | 1 | 동시에 진행 중인 계정 수 (최대 16) |
| `--gap` | 1200 | 워커 내 라운드 사이의 일시 정지 (ms) |
| `--model` | `deepseek-v4.1-flash` | 실제 게이트가 사용하는 모델 |
| `--group` | `deepseek` | 키가 생성되는 토큰 그룹 (`default`는 gpt 패밀리 제공) |
| `--aff` | 플릿 초대 코드 | 가입 시 보내는 초대 코드 — 쿼터의 원천 |
| `--pool <file>` | `proxies.txt` | 출구 목록 (환경 변수 `EASYMAX_PROXIES`) |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | 인박스 브로커 베이스 URL |
| `--inbox <chain>` | `broker,emailnator,local` | 메일박스 레일 순서 |
| `--tries` | 2 | 계정을 포기하기 전에 시도할 출구 수 |
| `--verify-only` | — | `keys.txt`의 모든 키를 채팅 게이트로 다시 실행 |
| `--screen` | — | 풀을 스크리닝하고 생존자를 `proxies.live.txt`에 기록 |

## 🛰️ 프록시 뒤에서

모든 EasyMax 요청은 **계정당 하나의 고정 출구**를 통해 나갑니다 — 계정의 register, login, token, gate 호출이 모두 같은 회선을 타며, 죽은 출구는 계정을 풀의 다음 출구로 넘깁니다 (`--tries`). 터널은 내장되어 있습니다: **`http`/`https` CONNECT (`user:pass@` 프록시 인증 포함), `socks5` (user/pass 포함), `socks4a`**. 직접 폴백은 없습니다 — 빈 풀에서는 레일이 자신의 회선에서 패널에 연결하는 대신 종료됩니다. 인박스 브로커 호출이 유일한 예외입니다: 이들은 `localhost`로 가며, 여기서 자체 브로커가 자체 송신을 처리합니다.

## 📄 파일

| 경로 | 내용 |
| --- | --- |
| `keys.txt` | 한 줄에 하나의 chat-200 키 — git 무시됨 |
| `keys-ungated.txt` | 재확인에 실패한 키 — 나중에 재시도 |
| `accounts.json` | 계정당 사용자 이름 / 비밀번호 / 이메일 / 쿼터 / 키 / 게이트 결과 |
| `proxies.txt` | 출구 목록, 한 줄에 하나 — git 무시됨 |
| `proxies.live.txt` | `--screen`의 생존자 |

## 🔌 9Router에 연결

[9Router](https://9router.com)는 자체 호스팅, OpenAI 호환 라우터입니다. 한 명령으로 `keys.txt`를 작동하는 콤보가 있는 프로바이더 노드로 바꿉니다:

```bash
node src/connect-9router.js

# or: npm run 9router
```

기본값: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. 그러면 모델이 `easymax/<model id>`로 제공되고 모든 키에 걸쳐 로드 밸런싱됩니다.

## 🔑 키 하나로 얻는 것

| | |
| --- | --- |
| 🏢 프로바이더 | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 프로바이더가 주는 것 | 키당 하나의 계정 — 초대 코드 가입이 충전하며, 모든 키가 채팅 검증됨 |
| 🔑 키 하나로 얻는 것 | 자체 계정에 범위가 지정된 하나의 API 키: 아래 엔드포인트의 5개 모델 ID, 플랜 한도 내에서. 쿼터는 **계정**에 있으므로, 이 도구가 키당 하나의 계정을 생성하는 것입니다 |
| 🌐 API 형태 | OpenAI 호환: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 데이터 | easymax.ai와 설정한 인박스 백엔드만 접촉되며, 키는 사용자 컴퓨터에 남습니다 |

## 🐞 이슈

패널이 가입 형태를 바꾸거나, 초대 보너스를 없애거나, 그룹을 재설정하면 도구는 해당 단계에서 멈추고 그렇게 알립니다. 실행한 명령과 정확한 출력을 포함해 **[이슈를 열어주세요](../../issues)**; PR을 환영합니다.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE) 참조.

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>