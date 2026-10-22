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

**Crie contas EasyMax em massa com chaves de API geradas automaticamente — inferência compatível com OpenAI (DeepSeek V4.1, DeepSeek V4 Pro, família GPT-6) + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://easymax.ai/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Nível gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-5-of-them) · [🧪 Use a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isso existe

EasyMax é um painel New API com **cadastro simples por nome de usuário + senha + e-mail** (Turnstile desativado, sem verificação de e-mail) cuja cota de boas-vindas vem de um **código de convite**: um cadastro sem código chega em `quota: 0` e sua chave responde `403 用户额度不足`, enquanto o mesmo registro com um `aff_code` concede **250000 de cota (≈ $0.50) por conta** — medido em 2026-10-19, e a razão pela qual este trilho existe. A unidade que escala é *uma conta por chave*; a ferramenta transforma isso em um `keys.txt` onde **cada linha sobreviveu a uma chamada de chat ao vivo**, uma saída de proxy fixada por conta, caixa de correio do seu próprio trilho de inbox.

## 🎁 Nível gratuito — quanto você recebe

**Cada conta é financiada pelo código de convite que você envia no cadastro** — esse é todo o nível gratuito.

| O quê | Valor |
| --- | --- |
| Cota de boas-vindas | **250000** (≈ $0.50) por conta, gasta por token no grupo da chave |
| De onde vem | `POST /api/user/register?turnstile=` com `aff_code=<code>` |
| Sem código de convite | `quota: 0` → a chave responde `403 用户额度不足` em todo modelo pago |
| Cartão exigido | **Não** |
| Captcha | **nenhum** — o Turnstile está desativado no cadastro e no login (`?turnstile=` aceita um valor vazio) |
| Verificação de e-mail | **não exigida** — o painel armazena o endereço e nunca envia um código |
| A unidade que escala | **uma conta = uma chave** → `--count N` é realmente "N contas financiadas" |

`--aff` usa por padrão o código de convite da própria frota; aponte-o para o seu e cada conta que você criar credita a você a comissão do painel (10 % para este painel).

> 💡 O nível gratuito é definido pela EasyMax e pode mudar. Confira os números ao vivo em [easymax.ai](https://easymax.ai) — e deixe o próprio portão da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 5

O catálogo do painel contém **101 ids de modelo** (`GET /api/pricing`) divididos em grupos; o **grupo de token que você cria decide o que uma chave pode servir**. Os ids marcados abaixo foram executados através de uma chamada de chat real em uma conta recém-criada:

| ID do modelo | Grupo de token | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (padrão) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` responde exatamente a lista do grupo: **2 ids** para uma chave do grupo `deepseek`, **14 ids** para uma chave do grupo `default` (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). O trilho cria `--group deepseek` por padrão porque esses ids são os mais baratos por token, então uma conta com cota de 250000 dura mais com eles; passe `--group default` (ou qualquer outro nome de grupo que o painel exponha) para criar uma chave para essa família em vez disso.

## 🧪 Como usar a API

A URL base é **`https://easymax.ai/v1`** — compatível com OpenAI, então qualquer coisa que fale OpenAI funciona (SDKs, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

O id `deepseek-v4-pro` é um modelo de raciocínio: ele responde com `reasoning_content` primeiro e `content` somente após o orçamento de pensamento, então dê a ele um `max_tokens` bem acima de 100 ou você verá um `content` vazio.

## 🛠 Início rápido

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

Uma chave é anexada a `keys.txt` **somente** após uma conclusão de chat ao vivo prová-la; uma conta que nunca chega a esse ponto é registrada em `accounts.json` e tentada novamente na próxima execução.

### 🖱️ O launcher

O launcher pede a lista de proxies, a contagem e o modelo de verificação, lembra-os em `launcher.config.json` e executa o CLI com as flags corretas.

## ✅ Verificado e funcionando — toda chave é testada

| Verificação | Resultado |
| --- | --- |
| registro `POST /api/user/register?turnstile=` | **200** `{"success":true}` — com `aff_code`, a conta chega em `quota: 250000` |
| login `POST /api/user/login?turnstile=` | **200** — payload New-API **v2** (`access_token` JWT + sessão) |
| autenticação | `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` em `/api/token/*` |
| chave | `POST /api/token/ {group}` → **200**, depois `POST /api/token/<id>/key` → chave completa |
| portão de chat — executado para **cada** chave antes de ser gravada | **200** com conteúdo real |
| uma chave que falha na verificação de chat | nunca gravada em `keys.txt` (a conta permanece reutilizável em `accounts.json`) |

Criadas com esta ferramenta durante a construção: **8 contas / 8 chaves, todas `quota 250000`, todas chat-200** em `deepseek-v4.1-flash`, através de dois tipos de túnel (CONNECT + SOCKS5) e 4 saídas.

## 🧭 Como funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| Etapa | Chamada | Observações |
| --- | --- | --- |
| caixa de correio | broker `POST /create` → emailnator → endereço gerado | o painel apenas armazena o endereço; o trilho nunca bloqueia por e-mail |
| registro | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | o código de convite é o que financia a conta |
| login | `POST /api/user/login?turnstile= {username,password}` | `access_token` retornado no corpo |
| conta | `GET /api/user/self` | fornece `id` (→ `New-Api-User`) e a `quota` que prova que o convite funcionou |
| chave | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | a chave em texto simples retorna uma vez |
| verificação | `POST /v1/chat/completions` | 200 ao vivo exigido antes de `keys.txt` |

## ⚙️ Opções do CLI

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| Flag | Padrão | Significado |
| --- | --- | --- |
| `--count` | 5 | contas (= chaves) a criar |
| `--conc` | 1 | contas em andamento ao mesmo tempo (limitado a 16) |
| `--gap` | 1200 | pausa em ms entre rodadas dentro de um worker |
| `--model` | `deepseek-v4.1-flash` | modelo que o portão ao vivo usa |
| `--group` | `deepseek` | grupo de token no qual a chave é criada (`default` serve a família gpt) |
| `--aff` | código de convite da frota | código de convite enviado no cadastro — esta é a fonte da cota |
| `--pool <file>` | `proxies.txt` | lista de saídas (env `EASYMAX_PROXIES`) |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | URL(s) base do broker de inbox |
| `--inbox <chain>` | `broker,emailnator,local` | ordem do trilho de caixa de correio |
| `--tries` | 2 | saídas tentadas por conta antes de desistir |
| `--verify-only` | — | reexecuta cada chave em `keys.txt` pelo portão de chat |
| `--screen` | — | filtra o pool, grava os sobreviventes em `proxies.live.txt` |

## 🛰️ Atrás de um proxy

Cada requisição ao EasyMax sai através de **uma saída fixada por conta** — as chamadas de registro, login, token e portão de uma conta todas trafegam pela mesma linha, e uma saída morta passa a conta para a próxima do pool (`--tries`). O túnel é embutido: **`http`/`https` CONNECT (com autenticação de proxy `user:pass@`), `socks5` (incluindo user/pass) e `socks4a`**. Não há fallback direto — com um pool vazio o trilho encerra em vez de discar para o painel a partir da sua própria linha. As chamadas ao broker de inbox são a única exceção: elas vão para `localhost`, onde o seu próprio broker faz sua própria saída.

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `keys.txt` | uma chave chat-200 por linha — ignorado pelo git |
| `keys-ungated.txt` | chaves que falharam na reverificação — tentar novamente depois |
| `accounts.json` | nome de usuário / senha / e-mail / cota / chave / resultado do portão por conta |
| `proxies.txt` | suas saídas, uma por linha — ignorado pelo git |
| `proxies.live.txt` | sobreviventes de `--screen` |

## 🔌 Conectar ao 9Router

[9Router](https://9router.com) é um roteador auto-hospedado e compatível com OpenAI. Um comando transforma `keys.txt` em um nó de provedor com combos funcionais:

```bash
node src/connect-9router.js

# or: npm run 9router
```

Padrões: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Os modelos são então servidos como `easymax/<model id>` e balanceados entre todas as chaves.

## 🔑 O que uma chave oferece

| | |
| --- | --- |
| 🏢 Provedor | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 O que o provedor oferece | uma conta por chave — o cadastro por código de convite a financia, cada chave verificada por chat |
| 🔑 O que uma chave oferece | uma chave de API limitada à sua própria conta: os 5 ids de modelo no endpoint abaixo, nos limites do seu plano. A cota fica na **conta**, que é exatamente por isso que esta ferramenta cria uma conta por chave |
| 🌐 Formato da API | Compatível com OpenAI: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Seus dados | apenas easymax.ai e o backend de inbox que você configurar são contatados; as chaves permanecem na sua máquina |

## 🐞 Problemas

Se o painel mudar o formato do seu cadastro, remover o bônus de convite ou alterar as chaves dos seus grupos, a ferramenta para nessa etapa e avisa. **[Abra uma issue](../../issues)** com o comando que você executou e a saída exata; PRs são bem-vindos.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>