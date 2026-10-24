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

**批量创建带自动生成 API 密钥的 EasyMax 账户 —— OpenAI 兼容推理（DeepSeek V4.1、DeepSeek V4 Pro、GPT-6 系列）+ 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://easymax.ai/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-5-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题反馈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么会有这个工具

EasyMax 是一个 New API 面板，注册只需**用户名 + 密码 + 邮箱**（Turnstile 已禁用，无需邮箱验证），其欢迎额度来自**邀请码**：直接注册会得到 `quota: 0`，其密钥会返回 `403 用户额度不足`；而同样的注册流程带上 `aff_code` 则每个账户可获得 **250000 额度（约 $0.50）** —— 实测于 2026-10-19，这也是这条流水线存在的根本原因。可扩展的单位是*一个账户对应一个密钥*；该工具将其转化为一个 `keys.txt`，其中**每一行都通过了一次真实的聊天调用**，每个账户固定一个代理出口，邮箱来自你自己的收件箱通道。

## 🎁 免费额度 —— 你能获得多少

**每个账户都由你在注册时发送的邀请码提供资金** —— 这就是全部的免费额度。

| 项目 | 值 |
| --- | --- |
| 欢迎额度 | 每个账户 **250000**（约 $0.50），按密钥所属分组按 token 消耗 |
| 来源 | `POST /api/user/register?turnstile=` 带 `aff_code=<code>` |
| 无邀请码 | `quota: 0` → 密钥在所有付费模型上返回 `403 用户额度不足` |
| 需要银行卡 | **否** |
| 验证码 | **无** —— 注册和登录时 Turnstile 已禁用（`?turnstile=` 接受空值） |
| 邮箱验证 | **不需要** —— 面板只存储地址，从不发送验证码 |
| 可扩展的单位 | **一个账户 = 一个密钥** → `--count N` 实际上就是「N 个已充值账户」 |

`--aff` 默认为本工具自带的邀请码；将其指向你自己的邀请码，你创建的每个账户都会为你带来面板的佣金（本面板为 10%）。

> 💡 免费额度由 EasyMax 设定，可能发生变化。请到 [easymax.ai](https://easymax.ai) 查看实时数字 —— 并让工具自身的关卡来判定：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 模型 —— 全部 5 个

面板的目录包含 **101 个模型 id**（`GET /api/pricing`），分布在多个分组中；**你创建的 token 分组决定了密钥能提供哪些服务**。下表中打勾的 id 均已在全新创建的账户上通过真实聊天调用验证：

| 模型 ID | Token 分组 | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek`（默认） | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` 返回的正是该分组的列表：`deepseek` 分组的密钥返回 **2 个 id**，`default` 分组的密钥返回 **14 个 id**（`gpt-5.5`、`gpt-5.5-openai-compact`、`gpt-5.6-luna`、`gpt-5.6-sol`、`gpt-5.6-terra`、`gpt-6-astra`、`gpt-6-luna`、`gpt-6-sol`、`gpt-6.1-sol`、`gpt-5.3-codex-spark`、`codex-auto-review`、`gpt-image-2`、`gpt-image-2.5-flare`、`gpt-image-2.5-sunburst`）。该流水线默认创建 `--group deepseek`，因为这些 id 的每 token 成本最低，所以 250000 额度的账户在这些模型上能使用最久；传入 `--group default`（或面板暴露的任何其他分组名）即可为该系列创建密钥。

## 🧪 如何使用 API

基础 URL 是 **`https://easymax.ai/v1`** —— 兼容 OpenAI，因此任何支持 OpenAI 的工具都能使用（SDK、Cursor、OpenCode、Kilo Code 等）。

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

`deepseek-v4-pro` 是一个推理模型：它先返回 `reasoning_content`，只有在思考预算用完后才返回 `content`，因此请将 `max_tokens` 设置得远高于 100，否则你会看到空的 `content`。

## 🚀 一条命令

```bash
node src/cli.js --count 10
```

这就是整个工具：每个密钥对应一个 EasyMax 账户（由邀请码提供资金），其 API 密钥只有在通过一次真实的 `chat-200` 后才会被创建并保留。验证码步骤是自动的 —— EasyMax 出厂时 Cloudflare Turnstile 处于*禁用*状态（面板接受空的 `?turnstile=`），因此 `--auto`（默认开启）无需浏览器；`src/solver.js` 就是实现这一点的地方。仓库旁的 `proxies.txt` 会被自动读取（每个账户固定一个出口）；没有它则直接连接。

`--dry` 会打印解析后的计划 —— 数量、代理池大小、求解器可用性、模型 —— 然后退出，不触碰任何文件也不发起任何请求：

```bash
node src/cli.js --dry
```

更喜欢菜单而不是命令行参数？`npm start`（或 `node src/launcher.js`）→ **1) Mint keys** → *How many keys? [10]*。

> ⚠️ **条款与账户风险。** 本工具针对第三方面板自动化账户创建和 API 密钥签发。这可能违反面板的服务条款，并可能导致账户、密钥或 IP 被封禁。**自动化由你自己负责**：请阅读提供商条款，使用你自己的收件箱和代理，并在运行前确认你所在地区允许这样做。

## 🛠 快速开始

```bash

# clone or fork this repository, then:
cd easymax-bulk-apikey

# 1) your proxy list, one per line (http://…, socks5://… or socks4a://…) — optional
printf 'http://127.0.0.1:8080\n' > proxies.txt   # optional — without it the tool runs direct

# 2) go — one command
node src/cli.js --count 50
# or the menu:  node src/launcher.js        (interactive)
```

密钥只有在一次真实的聊天补全证明其可用后才会被追加到 `keys.txt`；未能达到这一步的账户会被记录在 `accounts.json` 中，并在下次运行时重试。

### 🖱️ 启动器

`npm start`（或 `node src/launcher.js`）是同一 CLI 的菜单形式：**1) Mint keys** → *How many keys? [10]*（按 Enter 接受 10）会运行 `node src/cli.js --auto --count N`。它从不询问验证码、token 或代理 —— 存在 `proxies.txt` 时会自动使用。它以一张汇总表（存活/总数、延迟、错误类别）以及 `keys.txt` 路径结束；未通过关卡的密钥会落入 `keys-dead.txt`。

## ✅ 已验证可用 —— 每个密钥都经过测试

| 检查项 | 结果 |
| --- | --- |
| 注册 `POST /api/user/register?turnstile=` | **200** `{"success":true}` —— 带 `aff_code` 时，账户获得 `quota: 250000` |
| 登录 `POST /api/user/login?turnstile=` | **200** —— New-API **v2** 载荷（`access_token` JWT + session） |
| 认证 | 在 `/api/token/*` 上使用 `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` |
| 密钥 | `POST /api/token/ {group}` → **200**，然后 `POST /api/token/<id>/key` → 完整密钥 |
| 聊天关卡 —— 在写入**每个**密钥前运行 | **200** 且返回真实内容 |
| 未通过聊天检查的密钥 | 从不写入 `keys.txt`（账户在 `accounts.json` 中保持可复用） |

构建期间使用本工具创建：**8 个账户 / 每个密钥，全部 `quota 250000`，全部在 `deepseek-v4.1-flash` 上 chat-200**，跨越两种隧道类型（CONNECT + SOCKS5）和 4 个出口。

> **质量关卡。** 这里的每个密钥在写入 `keys.txt` 之前都通过了一次真实的 `chat-200`
> （失效密钥绝不会被输出）。路由器组合在模型层面遵循同样的规则：只有当模型能返回 `chat-200` 且能调用工具时，
> 才会添加条目 —— 不支持工具的模型、失效的密钥或失效的提供商会直接被丢弃而不是添加。可随时重新运行验证步骤；
> 失败会被报告，绝不会被隐藏。

## 🧭 工作原理

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| 步骤 | 调用 | 说明 |
| --- | --- | --- |
| 邮箱 | broker `POST /create` → emailnator → 生成的地址 | 面板只存储地址；流水线从不因邮件而阻塞 |
| 注册 | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | 邀请码是账户资金的来源 |
| 登录 | `POST /api/user/login?turnstile= {username,password}` | 响应体中返回 `access_token` |
| 账户 | `GET /api/user/self` | 返回 `id`（→ `New-Api-User`）以及证明邀请码生效的 `quota` |
| 密钥 | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | 明文密钥只返回一次 |
| 检查 | `POST /v1/chat/completions` | 写入 `keys.txt` 前必须通过真实 200 |

## ⚙️ CLI 选项

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --dry             # print the resolved plan, touch nothing
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `--count` | 5 | 要创建的账户数（= 密钥数） |
| `--auto` | 开启 | 使用内置验证码求解器（`--no-auto` 可关闭；EasyMax 没有实时验证码） |
| `--dry` | — | 打印解析后的计划并退出（不创建账户、不写文件、不联网） |
| `--conc` | 1 | 同时进行的账户数（上限 16） |
| `--gap` | 1200 | 工作线程内每轮之间的暂停毫秒数 |
| `--model` | `deepseek-v4.1-flash` | 实时关卡使用的模型 |
| `--group` | `deepseek` | 创建密钥的 token 分组（`default` 提供 gpt 系列） |
| `--aff` | 本工具自带邀请码 | 注册时发送的邀请码 —— 这是额度来源 |
| `--pool <file>` | `proxies.txt` | 出口列表（环境变量 `EASYMAX_PROXIES`）—— 可选：没有代理池时 CLI 直接连接 |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | 收件箱 broker 基础 URL |
| `--inbox <chain>` | `broker,emailnator,local` | 邮箱通道顺序 |
| `--exits` | 6 | 每个账户在放弃前尝试的出口数 |
| `--verify-only` | — | 通过聊天关卡重新检查 `keys.txt` 中的每个密钥 |
| `--screen` | — | 筛选代理池，将存活者写入 `proxies.live.txt` |

## 🛰️ 使用代理

当提供出口列表时，每个 EasyMax 请求都会经过它 —— **每个账户固定一个出口**：一个账户的注册、登录、token 和关卡调用都走同一条线路，失效的出口会将账户交给池中的下一个（`--exits`）。隧道是内置的：**`http`/`https` CONNECT（支持 `user:pass@` 代理认证）、`socks5`（包括用户名/密码）以及 `socks4a`**。

**可选 —— 大规模使用时推荐（每 IP 限制、封禁）。** 该工具在没有代理时也能工作。

- **有代理池：** 传入 `--pool <file>`（或设置 `EASYMAX_PROXIES`）—— 如上所述，每个账户固定一个出口。
- **无代理池：** CLI 会打印 `running WITHOUT a proxy (direct)` 并直接连接；注册、密钥创建和聊天关卡不变 —— 只是数据包从你自己的线路发出。
- 收件箱 broker 调用在两种模式下都发往 `localhost`，由你自己的 broker 处理其自身的出站流量。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `keys.txt` | 每行一个 chat-200 密钥 —— 已被 git 忽略 |
| `keys-ungated.txt` | 未通过重新检查的密钥 —— 稍后重试 |
| `keys-dead.txt` | 已创建但从未通过聊天关卡的密钥 —— 重试素材 |
| `src/solver.js` | `--auto` 背后的验证码模块（本面板上 Turnstile 已禁用） |
| `accounts.json` | 每个账户的用户名 / 密码 / 邮箱 / 额度 / 密钥 / 关卡结果 |
| `proxies.txt` | 你的出口，每行一个 —— 已被 git 忽略 |
| `proxies.live.txt` | `--screen` 的存活者 |

## 🔌 连接到 9Router

[9Router](https://9router.com) 是一个自托管、兼容 OpenAI 的路由器。一条命令即可将 `keys.txt` 转换为带有可用组合的提供商节点：

```bash
node src/connect-9router.js
# or: npm run 9router
```

默认值：`--base http://localhost:20128`、`--password 123456`、`--name "EasyMax"`、`--prefix easymax`、`--base-url https://easymax.ai/v1`。模型随后以 `easymax/<model id>` 形式提供，并在所有密钥之间负载均衡。

## 🔌 连接到 OmniRoute

[OmniRoute](https://omniroute.online) 是一个自托管、兼容 OpenAI 的路由器。一条命令即可将 `keys.txt` 转换为带有可用组合的提供商节点：

```bash
node src/connect-omniroute.js
# or: npm run omniroute
```

默认值：`--base http://localhost:20128`、`--password 123456`、`--name "EasyMax"`、`--prefix easymax`、`--base-url https://easymax.ai/v1`。模型随后以 `easymax/<model id>` 形式提供，并在所有密钥之间负载均衡。

## 🔑 一个密钥能给你什么

| | |
| --- | --- |
| 🏢 提供商 | **EasyMax** —— [easymax.ai](https://easymax.ai) |
| 🎁 提供商提供什么 | 每个密钥对应一个账户 —— 邀请码注册为其提供资金，每个密钥都经过聊天验证 |
| 🔑 一个密钥能给你什么 | 一个限定于其自身账户的 API 密钥：下方端点上的 5 个模型 id，受你套餐的限制。额度存在于**账户**上，这正是本工具为每个密钥创建一个账户的原因 |
| 🌐 API 形态 | 兼容 OpenAI：`POST https://easymax.ai/v1/chat/completions` |
| 🔒 你的数据 | 仅联系 easymax.ai 和你配置的收件箱后端；密钥保留在你的机器上 |

## 🐞 问题反馈

如果面板更改了其注册形态、取消了邀请奖励或重新划分了分组，工具会在该步骤停止并说明原因。**[提交 issue](../../issues)**，附上你运行的命令和确切的输出；欢迎 PR。

## 📄 许可证

MIT © 2026 —— 见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>