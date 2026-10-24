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

**自動生成された API キーで EasyMax アカウントを一括作成 — OpenAI 互換の推論（DeepSeek V4.1、DeepSeek V4 Pro、GPT-6 ファミリー）+ 9Router コネクター。**

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

EasyMax は **ユーザー名 + パスワード + メールアドレスのみの登録**（Turnstile 無効、メール認証なし）ができる New API パネルですが、ウェルカムクォータは**招待コード**から付与されます。招待コードなしの登録では `quota: 0` となり、そのキーは `403 用户额度不足` を返します。一方、`aff_code` を付けて同じ登録を行うと**アカウントごとに 250000 クォータ（約 $0.50）**が付与されます — 2026-10-19 に計測済みで、これがそもそもこのレールが存在する理由です。スケールする単位は*キーごとに 1 アカウント*であり、このツールはそれを `keys.txt` に変換します。そこでは**すべての行が実際のチャット呼び出しを通過した**もので、アカウントごとに 1 つの固定プロキシ出口、メールボックスはあなた自身の受信レールから取得します。

## 🎁 無料枠 — どれだけ得られるか

**すべてのアカウントは、登録時に送信する招待コードによって資金提供されます** — これが無料枠のすべてです。

| 項目 | 値 |
| --- | --- |
| ウェルカムクォータ | アカウントごとに **250000**（約 $0.50）、キーのグループごとにトークン単位で消費 |
| どこから来るか | `POST /api/user/register?turnstile=` に `aff_code=<code>` を付けて |
| 招待コードなしの場合 | `quota: 0` → キーはすべての有料モデルで `403 用户额度不足` を返す |
| カード登録 | **不要** |
| キャプチャ | **なし** — 登録とログインで Turnstile は無効（`?turnstile=` は空の値を受け付ける） |
| メール認証 | **不要** — パネルはアドレスを保存するだけで、コードを送信しない |
| スケールする単位 | **1 アカウント = 1 キー** → `--count N` は実質「N 個の資金提供済みアカウント」 |

`--aff` はデフォルトでフリート自身の招待コードを使用します。あなた自身のコードを指定すれば、作成するすべてのアカウントがパネルのコミッション（このパネルでは 10 %）をあなたに付与します。

> 💡 無料枠は EasyMax が設定するもので、変更される可能性があります。最新の数値は [easymax.ai](https://easymax.ai) で確認してください — そしてツール自身のゲートに判断させてください：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 モデル — 全 5 種類

パネルのカタログには**101 個のモデル ID**（`GET /api/pricing`）がグループに分かれて含まれています。**作成するトークングループが、キーが提供できるものを決めます**。以下にチェックを付けた ID は、新しく作成したアカウントで実際のチャット呼び出しを通して実行されました：

| モデル ID | トークングループ | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek`（デフォルト） | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` はそのグループのリストを正確に返します：`deepseek` グループのキーでは **2 個の ID**、`default` グループのキーでは **14 個の ID**（`gpt-5.5`、`gpt-5.5-openai-compact`、`gpt-5.6-luna`、`gpt-5.6-sol`、`gpt-5.6-terra`、`gpt-6-astra`、`gpt-6-luna`、`gpt-6-sol`、`gpt-6.1-sol`、`gpt-5.3-codex-spark`、`codex-auto-review`、`gpt-image-2`、`gpt-image-2.5-flare`、`gpt-image-2.5-sunburst`）。このレールはデフォルトで `--group deepseek` を作成します。これらの ID はトークンあたりのコストが最も安いため、250000 クォータのアカウントが最も長持ちするからです。代わりにそのファミリーのキーを作成するには `--group default`（またはパネルが公開している他のグループ名）を渡してください。

## 🧪 API の使い方

ベース URL は **`https://easymax.ai/v1`** です — OpenAI 互換なので、OpenAI を扱えるものなら何でも動作します（SDK、Cursor、OpenCode、Kilo Code など）。

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

`deepseek-v4-pro` の ID は推論モデルです：まず `reasoning_content` で応答し、思考バジェットの後にのみ `content` を返すため、`max_tokens` を 100 より十分大きく設定しないと空の `content` が表示されます。

## 🚀 コマンド 1 つ

```bash
node src/cli.js --count 10
```

これがツールのすべてです：キーごとに 1 つの EasyMax アカウント（招待コードで資金提供）、その API キーは実際の `chat-200` の後にのみ作成・保持されます。キャプチャのステップは自動です — EasyMax は Cloudflare Turnstile が*無効*の状態で提供されるため（パネルは空の `?turnstile=` を受け付ける）、`--auto`（デフォルトで有効）はブラウザを必要としません。`src/solver.js` がそれを表現している場所です。リポジトリの隣にある `proxies.txt` は自動的に読み込まれます（アカウントごとに 1 つの固定出口）。これがなければ実行は直接接続になります。

`--dry` は解決されたプラン — カウント、プールサイズ、ソルバーの可用性、モデル — を出力し、ファイルに触れたりリクエストを行ったりせずに終了します：

```bash
node src/cli.js --dry
```

フラグよりメニューが好みですか？ `npm start`（または `node src/launcher.js`）→ **1) Mint keys** → *How many keys? [10]*。

> ⚠️ **利用規約とアカウントのリスク。** このツールは、サードパーティのパネルに対してアカウント作成と API キー発行を自動化します。これはパネルの利用規約に違反する可能性があり、アカウント、キー、または IP が禁止されることがあります。**自動化はあなた自身の責任です**：プロバイダーの規約を読み、あなた自身の受信トレイとプロキシを使用し、実行する前にあなたが住んでいる場所でこれを行うことが許可されていることを確認してください。

## 🛠 クイックスタート

```bash

# clone or fork this repository, then:
cd easymax-bulk-apikey

# 1) your proxy list, one per line (http://…, socks5://… or socks4a://…) — optional
printf 'http://127.0.0.1:8080\n' > proxies.txt   # optional — without it the tool runs direct

# 2) go — one command
node src/cli.js --count 50
# or the menu:  node src/launcher.js        (interactive)
```

キーは、実際のチャット補完がそれを証明した**後にのみ** `keys.txt` に追加されます。その地点に到達しなかったアカウントは `accounts.json` に記録され、次回の実行で再試行されます。

### 🖱️ ランチャー

`npm start`（または `node src/launcher.js`）は、同じ CLI のメニュー形式です：**1) Mint keys** → *How many keys? [10]*（Enter で 10 を承認）が `node src/cli.js --auto --count N` を実行します。キャプチャ、トークン、プロキシについては一切尋ねません — `proxies.txt` が存在する場合は自動的に使用されます。最後にサマリーテーブル（live/total、レイテンシ、エラークラス）と `keys.txt` のパスを表示します。ゲートに失敗したキーは `keys-dead.txt` に入ります。

## ✅ 検証済み — すべてのキーがテストされています

| チェック | 結果 |
| --- | --- |
| 登録 `POST /api/user/register?turnstile=` | **200** `{"success":true}` — `aff_code` を付けると、アカウントは `quota: 250000` になる |
| ログイン `POST /api/user/login?turnstile=` | **200** — New-API **v2** ペイロード（`access_token` JWT + セッション） |
| 認証 | `/api/token/*` で `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` |
| キー | `POST /api/token/ {group}` → **200**、次に `POST /api/token/<id>/key` → 完全なキー |
| チャットゲート — 書き込まれる前に**すべての**キーに対して実行 | 実際のコンテンツで **200** |
| チャットチェックに失敗したキー | `keys.txt` に書き込まれることはない（アカウントは `accounts.json` で再利用可能なまま） |

ビルド中にこのツールで作成：**8 アカウント / すべてのキー、すべて `quota 250000`、すべて `deepseek-v4.1-flash` で chat-200**、2 種類のトンネル（CONNECT + SOCKS5）と 4 つの出口にわたって。

> **品質ゲート。** ここにあるすべてのキーは、`keys.txt` に書き込まれる前に実際の `chat-200` を通過しています
> （デッドキーは決して出荷されません）。ルーターのコンボもモデルレベルで同じルールに従います：エントリは
> **モデルが `chat-200` を返し、ツールを呼び出せる場合にのみ**追加されます — ツールサポートのないモデル、
> デッドキー、またはデッドプロバイダーは追加されずに削除されます。検証ステップはいつでも再実行できます。
> 失敗は報告され、決して隠されません。

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
| メールボックス | ブローカー `POST /create` → emailnator → 生成されたアドレス | パネルはアドレスを保存するだけ。レールはメールでブロックされることはない |
| 登録 | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | 招待コードがアカウントに資金を提供する |
| ログイン | `POST /api/user/login?turnstile= {username,password}` | ボディに `access_token` が返る |
| アカウント | `GET /api/user/self` | `id`（→ `New-Api-User`）と、招待が機能したことを証明する `quota` を返す |
| キー | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | 平文のキーが一度だけ返る |
| チェック | `POST /v1/chat/completions` | `keys.txt` の前に実際の 200 が必要 |

## ⚙️ CLI オプション

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --dry             # print the resolved plan, touch nothing
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| フラグ | デフォルト | 意味 |
| --- | --- | --- |
| `--count` | 5 | 作成するアカウント（= キー）の数 |
| `--auto` | オン | 組み込みのキャプチャソルバーを使用（`--no-auto` でオプトアウト。EasyMax にはライブキャプチャがない） |
| `--dry` | — | 解決されたプランを出力して終了（アカウントなし、ファイルなし、ネットワークなし） |
| `--conc` | 1 | 同時に処理するアカウント数（最大 16） |
| `--gap` | 1200 | ワーカー内のラウンド間の一時停止（ミリ秒） |
| `--model` | `deepseek-v4.1-flash` | ライブゲートが使用するモデル |
| `--group` | `deepseek` | キーが作成されるトークングループ（`default` は gpt ファミリーを提供） |
| `--aff` | フリートの招待コード | 登録時に送信される招待コード — これがクォータの源 |
| `--pool <file>` | `proxies.txt` | 出口リスト（環境変数 `EASYMAX_PROXIES`）— オプション：プールがなければ CLI は直接接続する |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | 受信トレイブローカーのベース URL |
| `--inbox <chain>` | `broker,emailnator,local` | メールボックスレールの順序 |
| `--exits` | 6 | アカウントが諦められる前に試行される出口の数 |
| `--verify-only` | — | `keys.txt` のすべてのキーをチャットゲートで再実行 |
| `--screen` | — | プールをスクリーニングし、生存者を `proxies.live.txt` に書き込む |

## 🛰️ プロキシの背後で

プールが提供されている場合、すべての EasyMax リクエストは出口リストを経由します — **アカウントごとに 1 つの固定出口**：アカウントの登録、ログイン、トークン、ゲート呼び出しはすべて同じ回線に乗り、デッド出口はアカウントをプール内の次のものに引き渡します（`--exits`）。トンネルは組み込みです：**`http`/`https` CONNECT（`user:pass@` プロキシ認証付き）、`socks5`（ユーザー/パス付きを含む）、`socks4a`**。

**オプション — 大規模では推奨（IP ごとの制限、禁止）。** ツールはプロキシなしでも動作します。

- **プールあり：** `--pool <file>` を渡す（または `EASYMAX_PROXIES` を設定）— 上記のようにアカウントごとに 1 つの固定出口。
- **プールなし：** CLI は `running WITHOUT a proxy (direct)` と出力して直接接続します。登録、キー作成、チャットゲートは変わりません — パケットがあなた自身の回線から出るだけです。
- 受信トレイブローカーの呼び出しはどちらのモードでも `localhost` に送られ、あなた自身のブローカーが独自の egress を行います。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `keys.txt` | 1 行に 1 つの chat-200 キー — git で無視される |
| `keys-ungated.txt` | 再チェックに失敗したキー — 後で再試行 |
| `keys-dead.txt` | 作成されたがチャットゲートを通過しなかったキー — 再試行用の素材 |
| `src/solver.js` | `--auto` の背後にあるキャプチャモジュール（このパネルでは Turnstile は無効） |
| `accounts.json` | アカウントごとのユーザー名 / パスワード / メール / クォータ / キー / ゲート結果 |
| `proxies.txt` | あなたの出口、1 行に 1 つ — git で無視される |
| `proxies.live.txt` | `--screen` の生存者 |

## 🔌 9Router への接続

[9Router](https://9router.com) は、セルフホスト型の OpenAI 互換ルーターです。1 つのコマンドで `keys.txt` を、動作するコンボを持つプロバイダーノードに変換します：

```bash
node src/connect-9router.js
# or: npm run 9router
```

デフォルト：`--base http://localhost:20128`、`--password 123456`、`--name "EasyMax"`、`--prefix easymax`、`--base-url https://easymax.ai/v1`。モデルは `easymax/<model id>` として提供され、すべてのキーにわたって負荷分散されます。

## 🔌 OmniRoute への接続

[OmniRoute](https://omniroute.online) は、セルフホスト型の OpenAI 互換ルーターです。1 つのコマンドで `keys.txt` を、動作するコンボを持つプロバイダーノードに変換します：

```bash
node src/connect-omniroute.js
# or: npm run omniroute
```

デフォルト：`--base http://localhost:20128`、`--password 123456`、`--name "EasyMax"`、`--prefix easymax`、`--base-url https://easymax.ai/v1`。モデルは `easymax/<model id>` として提供され、すべてのキーにわたって負荷分散されます。

## 🔑 1 つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダー | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 プロバイダーが提供するもの | キーごとに 1 つのアカウント — 招待コード登録が資金を提供し、すべてのキーがチャット検証済み |
| 🔑 1 つのキーで得られるもの | 独自のアカウントにスコープされた 1 つの API キー：以下のエンドポイントの 5 つのモデル ID を、あなたのプランの制限で。クォータは**アカウント**に存在し、まさにそれがこのツールがキーごとに 1 つのアカウントを作成する理由です |
| 🌐 API の形 | OpenAI 互換：`POST https://easymax.ai/v1/chat/completions` |
| 🔒 あなたのデータ | easymax.ai と、あなたが設定した受信トレイバックエンドのみが接触されます。キーはあなたのマシンに留まります |

## 🐞 問題報告

パネルが登録の形を変更したり、招待ボーナスを廃止したり、グループを再キー化した場合、ツールはそのステップで停止し、その旨を報告します。実行したコマンドと正確な出力を添えて**[issue を開いてください](../../issues)**。PR も歓迎します。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照。

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>