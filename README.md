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

**Bulk-create EasyMax accounts with auto-generated API keys — OpenAI-compatible inference (DeepSeek V4.1, DeepSeek V4 Pro, GPT-6 family) + 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://easymax.ai/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-5-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

EasyMax is a New API panel with a **plain username + password + e-mail sign-up** (Turnstile disabled, no e-mail verification) whose welcome quota comes from an **invite code**: a bare sign-up lands on `quota: 0` and its key answers `403 用户额度不足`, while the same registration with an `aff_code` grants **250000 quota (≈ $0.50) per account** — measured 2026-10-19, and the reason this rail exists at all. The unit that scales is *one account per key*; the tool turns that into a `keys.txt` where **every line survived a live chat call**, one pinned proxy exit per account, mailbox from your own inbox rail.

## 🎁 Free tier — how much you get

**Every account is funded by the invite code you send at sign-up** — that is the whole free tier.

| What | Value |
| --- | --- |
| Welcome quota | **250000** (≈ $0.50) per account, spent per token on the key's group |
| Where it comes from | `POST /api/user/register?turnstile=` with `aff_code=<code>` |
| Without an invite code | `quota: 0` → the key answers `403 用户额度不足` on every priced model |
| Card required | **No** |
| Captcha | **none** — Turnstile is disabled on register and login (`?turnstile=` accepts an empty value) |
| E-mail verification | **not required** — the panel stores the address and never mails a code |
| The unit that scales | **one account = one key** → `--count N` is really "N funded accounts" |

`--aff` defaults to the fleet's own invite code; point it at yours and every account you mint credits you the panel's commission (10 % for this panel).

> 💡 The free tier is set by EasyMax and can change. Check the live numbers at [easymax.ai](https://easymax.ai) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 5 of them

The panel's catalogue carries **101 model ids** (`GET /api/pricing`) split across groups; the **token group you mint decides what a key can serve**. Ids ticked below were run through a real chat call on a freshly minted account:

| Model ID | Token group | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (default) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` answers exactly the group's list: **2 ids** for a `deepseek`-group key, **14 ids** for a `default`-group key (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). The rail mints `--group deepseek` by default because those ids are the cheapest per token, so a 250000-quota account lasts the longest on them; pass `--group default` (or any other group name the panel exposes) to mint a key for that family instead.

## 🧪 How to use the API

The base URL is **`https://easymax.ai/v1`** — OpenAI-compatible, so anything that speaks OpenAI works (SDKs, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

The `deepseek-v4-pro` id is a reasoning model: it answers with `reasoning_content` first and `content` only after the thinking budget, so give it `max_tokens` well above 100 or you will see an empty `content`.

## 🛠 Quick start

```bash
# clone or fork this repository, then:
cd easymax-bulk-apikey

# 1) your proxy list, one per line (http://…, socks5://… or socks4a://…) — optional
printf 'http://127.0.0.1:8080\n' > proxies.txt   # optional — without it the tool runs direct

# 2) go
node src/launcher.js        # interactive
# or directly:
node src/cli.js --count 50
```

A key is appended to `keys.txt` **only** after a live chat completion proves it; an account that never reaches that point is recorded in `accounts.json` and retried on the next run.

### 🖱️ The launcher

The launcher asks for the proxy list (optional — without one the CLI runs direct), count and verification model, remembers them in `launcher.config.json`, and runs the CLI with the right flags.

## ✅ Verified working — every key is tested

| Check | Result |
| --- | --- |
| register `POST /api/user/register?turnstile=` | **200** `{"success":true}` — with `aff_code`, the account lands on `quota: 250000` |
| login `POST /api/user/login?turnstile=` | **200** — New-API **v2** payload (`access_token` JWT + session) |
| auth | `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` on `/api/token/*` |
| key | `POST /api/token/ {group}` → **200**, then `POST /api/token/<id>/key` → full key |
| chat gate — run for **every** key before it is written | **200** with real content |
| a key that fails its chat check | never written to `keys.txt` (the account stays reusable in `accounts.json`) |

Minted with this tool during the build: **keys verified** on `deepseek-v4.1-flash`, across two tunnel types (CONNECT + SOCKS5) and 4 exits.

## 🧭 How it works

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| Step | Call | Notes |
| --- | --- | --- |
| mailbox | broker `POST /create` → emailnator → generated address | the panel only stores the address; the rail never blocks on mail |
| register | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | the invite code is what funds the account |
| login | `POST /api/user/login?turnstile= {username,password}` | `access_token` back in the body |
| account | `GET /api/user/self` | gives `id` (→ `New-Api-User`) and the `quota` that proves the invite worked |
| key | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | the plaintext key comes back once |
| check | `POST /v1/chat/completions` | live 200 required before `keys.txt` |

## ⚙️ CLI options

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--count` | 5 | accounts (= keys) to mint |
| `--conc` | 1 | accounts in flight at once (capped at 16) |
| `--gap` | 1200 | pause in ms between rounds inside a worker |
| `--model` | `deepseek-v4.1-flash` | model the live gate uses |
| `--group` | `deepseek` | token group the key is created in (`default` serves the gpt family) |
| `--aff` | fleet invite code | invite code sent at sign-up — this is the quota source |
| `--pool <file>` | `proxies.txt` | exit list (env `EASYMAX_PROXIES`) — optional: without a pool the CLI connects directly |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | inbox broker base URL(s) |
| `--inbox <chain>` | `broker,emailnator,local` | mailbox rail order |
| `--tries` | 2 | exits tried per account before it is given up |
| `--verify-only` | — | re-run every key in `keys.txt` through the chat gate |
| `--screen` | — | screen the pool, write the survivors to `proxies.live.txt` |

## 🛰️ Behind a proxy

Every EasyMax request goes through the exit list when one is provided — **one pinned exit per account**: the register, login, token and gate calls of an account all ride the same line, and a dead exit hands the account to the next one in the pool (`--tries`). The tunnel is built in: **`http`/`https` CONNECT (with `user:pass@` proxy auth), `socks5` (including user/pass) and `socks4a`**.

**Optional — recommended at scale (per-IP limits, bans).** The tool works without a proxy too.

- **With a pool:** pass `--pool <file>` (or set `EASYMAX_PROXIES`) — one pinned exit per account, as above.
- **Without a pool:** the CLI prints `running WITHOUT a proxy (direct)` and connects directly; sign-up, key minting and the chat gate are unchanged — only the packets leave from your own line.
- Inbox-broker calls go to `localhost` in either mode, where your own broker does its own egress.

## 📄 Files

| Path | Contents |
| --- | --- |
| `keys.txt` | one chat-200 key per line — git-ignored |
| `keys-ungated.txt` | keys that failed the re-check — retry later |
| `accounts.json` | username / password / e-mail / quota / key / gate result per account |
| `proxies.txt` | your exits, one per line — git-ignored |
| `proxies.live.txt` | survivors of `--screen` |

## 🔌 Connect to 9Router

[9Router](https://9router.com) is a self-hosted, OpenAI-compatible router. One command turns `keys.txt` into a provider-node with working combos:

```bash
node src/connect-9router.js
# or: npm run 9router
```

Defaults: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Models are then served as `easymax/<model id>` and load-balanced across every key.

## 🔑 What one key gets you

| | |
| --- | --- |
| 🏢 Provider | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 What the provider gives | one account per key — invite-code sign-up funds it, every key chat-verified |
| 🔑 What one key gets you | one API key scoped to its own account: the 5 model ids on the endpoint below, at your plan's limits. The quota lives on the **account**, which is exactly why this tool creates one account per key |
| 🌐 API shape | OpenAI-compatible: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Your data | only easymax.ai and the inbox backend you configure are contacted; keys stay on your machine |

## 🐞 Issues

If the panel changes its sign-up shape, drops the invite bonus or re-keys its groups, the tool stops at that step and says so. **[Open an issue](../../issues)** with the command you ran and the exact output; PRs are welcome.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>
