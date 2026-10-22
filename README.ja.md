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

**自動生成された API キーで EasyMax アカウントを一括作成 — OpenAI 互換の推論（DeepSeek V4.1、DeepSeek V4 Pro、GPT-6 ファミリー）+ 9Router コネクタ。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://easymax.ai/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-5-of-them) · [🧪 API の使い方](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🐞 問題報告](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ これが存在する理由

EasyMax は New API パネルで、**ユーザー名 + パスワード + メールアドレスだけで登録**でき（Turnstile は無効、メール認証なし）、そのウェルカムクォータは**招待コード**から付与されます。招待コードなしで登録すると `quota: 0` になり、そのキーは `403 用户额度不足` を返しますが、同じ登録でも `aff_code` を付ければ**1 アカウントあたり 250000 クォータ（約 $0.50）**が付与されます — これは 2026-10-19 に計測されたものであり、このツールが存在する理由そのものです。スケールする単位は*1 アカウント = 1 キー*であり、このツールはそれを `keys.txt` に変換します。そこでは**すべての行が実際のチャット呼び出しを通過しており**、1 アカウントにつき 1 つの固定プロキシ出口、メールボックスは自前の受信基盤から取得します。

## 🎁 無料枠 — どれだけ得られるか

**すべてのアカウントは、登録時に送信する招待コードによって資金提供されます** — これが無料枠のすべてです。

| 項目 | 値 |
| --- | --- |
| ウェルカムクォータ | **250000**（約 $0.50）/ アカウント、キーのグループに応じてトークン単位で消費 |
| 付与元 | `POST /api/user/register?turnstile=` に `aff_code=<code>` を付けて送信 |
| 招待コードなしの場合 | `quota: 0` → キーは有料モデルすべてで `403 用户额度不足` を返す |
| カード登録 | **不要** |
| キャプチャ | **なし** — 登録・ログインで Turnstile は無効（`?turnstile=` は空値を受け付ける） |
| メール認証 | **不要** — パネルはアドレスを保存するだけで、コードを送信しない |
| スケールする単位 | **1 アカウント = 1 キー** → `--count N` は実質「N 個の資金提供済みアカウント」 |

`--aff` はデフォルトでこのフリート自身の招待コードを使用します。自分のコードを指定すれば、作成したすべてのアカウントがパネルのコミッション（このパネルでは 10 %）をあなたに付与します。

> 💡 無料枠は EasyMax が設定するもので、変更される可能性があります。最新の数値は [easymax.ai](https://easymax.ai) で確認してください — そしてツール自身のゲートに判断させましょう:

```bash
node src/cli.js --verify-only     # keys.txt のすべてのキーが実際のチャット呼び出しで再テストされる
```

## 🤖 モデル — 全 5 種類

パネルのカタログには**101 個のモデル ID**（`GET /api/pricing`）がグループ別に分かれており、**作成するトークングループがキーで提供できるものを決めます**。以下にチェックを付けた ID は、新しく作成したアカウントで実際のチャット呼び出しを通過しています:

| モデル ID | トークングループ | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek`（デフォルト） | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` はそのグループのリストを正確に返します: `deepseek` グループのキーでは **2 個の ID**、`default` グループのキーでは **14 個の ID**（`gpt-5.5`、`gpt-5.5-openai-compact`、`gpt-5.6-luna`、`gpt-5.6-sol`、`gpt-5.6-terra`、`gpt-6-astra`、`gpt-6-luna`、`gpt-6-sol`、`gpt-6.1-sol`、`gpt-5.3-codex-spark`、`codex-auto-review`、`gpt-image-2`、`gpt-image-2.5-flare`、`gpt-image-2.5-sunburst`）。このツールはデフォルトで `--group deepseek` を作成します。これらの ID はトークンあたりのコストが最も安いため、250000 クォータのアカウントが最も長持ちするからです。代わりに `--group default`（またはパネルが公開している他のグループ名）を指定すると、そのファミリー用のキーを作成できます。

## 🧪 API の使い方

ベース URL は **`https://easymax.ai/v1`** です — OpenAI 互換なので、OpenAI を扱えるものなら何でも動作します（SDK、Cursor、OpenCode、Kilo Code など）。

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

`deepseek-v4-pro` の ID は推論モデルです: まず `reasoning_content` で応答し、思考予算の後にのみ `content` を返すため、`max_tokens` を 100 より十分大きく設定しないと `content` が空になります。

## 🛠 クイックスタート

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

キーは、実際のチャット補完がそれを証明した**後にのみ** `keys.txt` に追記されます。そこに到達しなかったアカウントは `accounts.json` に記録され、次回の実行で再試行されます。

### 🖱️ ランチャー

ランチャーはプロキシリスト、カウント、検証モデルを尋ね、それらを `launcher.config.json` に記憶し、適切なフラグで CLI を実行します。

## ✅ 検証済み — すべてのキーがテストされています

| チェック | 結果 |
| --- | --- |
| 登録 `POST /api/user/register?turnstile=` | **200** `{"success":true}` — `aff_code` を付けると、アカウントは `quota: 250000` になる |
| ログイン `POST /api/user/login?turnstile=` | **200** — New-API **v2** ペイロード（`access_token` JWT + セッション） |
| 認証 | `/api/token/*` に対して `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` |
| キー | `POST /api/token/ {group}` → **200**、続いて `POST /api/token/<id>/key` → 完全なキー |
| チャットゲート — 書き込まれる前に**すべての**キーで実行 | 実際のコンテンツ付きで **200** |
| チャットチェックに失敗したキー | `keys.txt` には決して書き込まれない（アカウントは `accounts.json` で再利用可能なまま） |

ビルド中にこのツールで作成されたもの: **8 アカウント / 8 キー、すべて `quota 250000`、すべて `deepseek-v4.1-flash` でチャット 200**、2 種類のトンネル（CONNECT + SOCKS5）と 4 つの出口にわたって。

## 🧭 仕組み

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| ステップ | 呼び出し | 備考 |
| --- | --- | --- |
| メールボックス | ブローカー `POST /create` → emailnator → 生成されたアドレス | パネルはアドレスを保存するだけ。このツールはメールでブロックされることはない |
| 登録 | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | 招待コードがアカウントに資金を提供する |
| ログイン | `POST /api/user/login?turnstile= {username,password}` | ボディに `access_token` が返る |
| アカウント | `GET /api/user/self` | `id`（→ `New-Api-User`）と、招待が機能したことを証明する `quota` を返す |
| キー | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | 平文のキーが一度だけ返る |
| チェック | `POST /v1/chat/completions` | `keys.txt` の前に実際の 200 が必要 |

## ⚙️ CLI オプション

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| フラグ | デフォルト | 意味 |
| --- | --- | --- |
| `--count` | 5 | 作成するアカウント（= キー）数 |
| `--conc` | 1 | 同時に処理するアカウント数（最大 16） |
| `--gap` | 1200 | ワーカー内のラウンド間の一時停止（ミリ秒） |
| `--model` | `deepseek-v4.1-flash` | ライブゲートが使用するモデル |
| `--group` | `deepseek` | キーを作成するトークングループ（`default` は gpt ファミリーを提供） |
| `--aff` | フリートの招待コード | 登録時に送信する招待コード — これがクォータの源 |
| `--pool <file>` | `proxies.txt` | 出口リスト（環境変数 `EASYMAX_PROXIES`） |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | 受信ブローカーのベース URL |
| `--inbox <chain>` | `broker,emailnator,local` | メールボックス基盤の順序 |
| `--tries` | 2 | アカウントを諦める前に試す出口の数 |
| `--verify-only` | — | `keys.txt` のすべてのキーをチャットゲートで再実行 |
| `--screen` | — | プールをスクリーニングし、生存者を `proxies.live.txt` に書き込む |

## 🛰️ プロキシの背後で

すべての EasyMax リクエストは**1 アカウントにつき 1 つの固定出口**を通ります — アカウントの登録、ログイン、トークン、ゲート呼び出しはすべて同じ回線を通り、死んだ出口はアカウントをプール内の次の出口に引き渡します（`--tries`）。トンネルは組み込みです: **`http`/`https` CONNECT（`user:pass@` プロキシ認証付き）、`socks5`（ユーザー/パスワード含む）、`socks4a`**。直接フォールバックはありません — プールが空の場合、このツールは自分の回線からパネルにダイヤルするのではなく終了します。受信ブローカーの呼び出しだけが例外です: これらは `localhost` に行き、そこでは自分のブローカーが独自の外向き通信を行います。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `keys.txt` | 1 行につき 1 つのチャット 200 キー — git 無視 |
| `keys-ungated.txt` | 再チェックに失敗したキー — 後で再試行 |
| `accounts.json` | アカウントごとのユーザー名 / パスワード / メール / クォータ / キー / ゲート結果 |
| `proxies.txt` | 出口、1 行に 1 つ — git 無視 |
| `proxies.live.txt` | `--screen` の生存者 |

## 🔌 9Router に接続

[9Router](https://9router.com) はセルフホスト型の OpenAI 互換ルーターです。1 つのコマンドで `keys.txt` を動作するコンボを持つプロバイダーノードに変換します:

```bash
node src/connect-9router.js

```

## 🔌 OmniRoute に接続

[OmniRoute](https://omniroute.online) はセルフホスト型の OpenAI 互換ルーターです。1 つのコマンドで `keys.txt` を動作するコンボを持つプロバイダーノードに変換します:

```bash
node src/connect-omniroute.js

# or: npm run 9router
```

デフォルト: `--base http://localhost:20128`、`--password 123456`、`--name "EasyMax"`、`--prefix easymax`、`--base-url https://easymax.ai/v1`。モデルは `easymax/<model id>` として提供され、すべてのキーにわたって負荷分散されます。

## 🔑 1 つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダー | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 プロバイダーが提供するもの | 1 キーにつき 1 アカウント — 招待コード登録が資金を提供し、すべてのキーがチャット検証済み |
| 🔑 1 つのキーで得られるもの | 独自のアカウントにスコープされた 1 つの API キー: 以下のエンドポイントの 5 つのモデル ID を、プランの制限内で。クォータは**アカウント**に存在するため、このツールが 1 キーにつき 1 アカウントを作成するのです |
| 🌐 API の形式 | OpenAI 互換: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 あなたのデータ | 接触するのは easymax.ai と設定した受信バックエンドのみ。キーはあなたのマシンに留まります |

## 🐞 問題報告

パネルが登録の形式を変更したり、招待ボーナスを廃止したり、グループを再設定した場合、ツールはそのステップで停止し、その旨を報告します。実行したコマンドと正確な出力を添えて**[issue を作成してください](../../issues)**。PR も歓迎します。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照。

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>