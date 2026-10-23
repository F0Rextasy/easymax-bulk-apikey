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
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Nível gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-5-of-them) · [🧪 Use a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isto existe

EasyMax é um painel New API com **cadastro simples por nome de usuário + senha + e-mail** (Turnstile desativado, sem verificação por e-mail) cuja cota de boas-vindas vem de um **código de convite**: um cadastro sem código chega a `quota: 0` e sua chave responde `403 用户额度不足`, enquanto o mesmo registro com um `aff_code` concede **250000 de cota (≈ $0.50) por conta** — medido em 2026-10-19, e o motivo pelo qual este trilho existe. A unidade que escala é *uma conta por chave*; a ferramenta transforma isso em um `keys.txt` onde **cada linha sobreviveu a uma chamada de chat ao vivo**, uma saída de proxy fixada por conta, caixa de entrada do seu próprio trilho de inbox.

## 🎁 Nível gratuito — quanto você recebe

**Cada conta é financiada pelo código de convite que você envia no cadastro** — esse é todo o nível gratuito.

| O quê | Valor |
| --- | --- |
| Cota de boas-vindas | **250000** (≈ $0.50) por conta, gasta por token no grupo da chave |
| De onde vem | `POST /api/user/register?turnstile=` com `aff_code=<code>` |
| Sem código de convite | `quota: 0` → a chave responde `403 用户额度不足` em todo modelo pago |
| Cartão exigido | **Não** |
| Captcha | **nenhum** — o Turnstile está desativado no registro e no login (`?turnstile=` aceita um valor vazio) |
| Verificação por e-mail | **não exigida** — o painel armazena o endereço e nunca envia um código |
| A unidade que escala | **uma conta = uma chave** → `--count N` é na verdade "N contas financiadas" |

`--aff` usa por padrão o código de convite da própria frota; aponte-o para o seu e cada conta que você criar credita a você a comissão do painel (10 % para este painel).

> 💡 O nível gratuito é definido pela EasyMax e pode mudar. Confira os números ao vivo em [easymax.ai](https://easymax.ai) — e deixe o próprio portão da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 5

O catálogo do painel contém **101 ids de modelo** (`GET /api/pricing`) divididos em grupos; o **grupo de token que você cria decide o que uma chave pode servir**. Os ids marcados abaixo passaram por uma chamada de chat real em uma conta recém-criada:

| ID do modelo | Grupo de token | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (padrão) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` responde exatamente a lista do grupo: **2 ids** para uma chave do grupo `deepseek`, **14 ids** para uma chave do grupo `default` (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). O trilho cria `--group deepseek` por padrão porque esses ids são os mais baratos por token, então uma conta com 250000 de cota dura mais neles; passe `--group default` (ou qualquer outro nome de grupo que o painel exponha) para criar uma chave para essa família.

## 🧪 Como usar a API

A URL base é **`https://easymax.ai/v1`** — compatível com OpenAI, então qualquer coisa que fale OpenAI funciona (SDKs, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

O id `deepseek-v4-pro` é um modelo de raciocínio: ele responde com `reasoning_content` primeiro e `content` só depois do orçamento de pensamento, então dê a ele um `max_tokens` bem acima de 100 ou você verá um `content` vazio.

## 🚀 Um comando

```bash
node src/cli.js --count 10
```

Essa é a ferramenta inteira: uma conta EasyMax por chave (financiada pelo código de convite), sua chave de API criada e mantida **apenas** após um `chat-200` ao vivo. A etapa de captcha é automática — a EasyMax vem com o Cloudflare Turnstile *desativado* (o painel aceita um `?turnstile=` vazio), então `--auto` (ativado por padrão) não precisa de navegador; `src/solver.js` é onde isso se expressa. Um `proxies.txt` ao lado do repositório é detectado automaticamente (uma saída fixada por conta); sem ele, a execução vai direto.

`--dry` imprime o plano resolvido — contagem, tamanho do pool, disponibilidade do solver, modelos — e sai sem tocar em um único arquivo ou fazer uma requisição:

```bash
node src/cli.js --dry
```

Prefere um menu às flags? `npm start` (ou `node src/launcher.js`) → **1) Mint keys** → *How many keys? [10]*.

> ⚠️ **Termos e risco de conta.** Esta ferramenta automatiza a criação de contas e a emissão de chaves de API contra um painel de terceiros. Isso pode violar os Termos de Serviço do painel e pode levar ao banimento de contas, chaves ou IPs. **A automação é de sua própria responsabilidade**: leia os termos do provedor, use sua própria caixa de entrada e proxies, e certifique-se de que você tem permissão para fazer isso onde mora antes de executar.

## 🛠 Início rápido

```bash

# clone or fork this repository, then:
cd easymax-bulk-apikey

# 1) your proxy list, one per line (http://…, socks5://… or socks4a://…) — optional
printf 'http://127.0.0.1:8080\n' > proxies.txt   # optional — without it the tool runs direct

# 2) go — one command
node src/cli.js --count 50
# or the menu:  node src/launcher.js        (interactive)
```

Uma chave é anexada a `keys.txt` **apenas** após uma conclusão de chat ao vivo prová-la; uma conta que nunca chega a esse ponto é registrada em `accounts.json` e tentada novamente na próxima execução.

### 🖱️ O launcher

`npm start` (ou `node src/launcher.js`) é a forma de menu do mesmo CLI: **1) Mint keys** → *How many keys? [10]* (Enter aceita 10) executa `node src/cli.js --auto --count N`. Ele nunca pergunta sobre captcha, token ou proxy — `proxies.txt` é usado automaticamente quando presente. Ele termina com uma tabela de resumo (ativas/total, latência, classes de erro) mais o caminho de `keys.txt`; chaves que falharam no portão vão para `keys-dead.txt`.

## ✅ Verificado e funcionando — toda chave é testada

| Verificação | Resultado |
| --- | --- |
| registro `POST /api/user/register?turnstile=` | **200** `{"success":true}` — com `aff_code`, a conta chega a `quota: 250000` |
| login `POST /api/user/login?turnstile=` | **200** — payload New-API **v2** (`access_token` JWT + sessão) |
| autenticação | `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` em `/api/token/*` |
| chave | `POST /api/token/ {group}` → **200**, depois `POST /api/token/<id>/key` → chave completa |
| portão de chat — executado para **cada** chave antes de ser gravada | **200** com conteúdo real |
| uma chave que falha na verificação de chat | nunca gravada em `keys.txt` (a conta permanece reutilizável em `accounts.json`) |

Criadas com esta ferramenta durante a construção: **8 contas / cada chave, todas `quota 250000`, todas chat-200** em `deepseek-v4.1-flash`, através de dois tipos de túnel (CONNECT + SOCKS5) e 4 saídas.

> **Portões de qualidade.** Toda chave aqui passou por um `chat-200` ao vivo antes de ser gravada em `keys.txt`
> (chaves mortas nunca são entregues). As combinações do roteador seguem a mesma regra no nível do modelo: uma entrada é
> adicionada **apenas se o modelo responder `chat-200` e puder chamar ferramentas** — um modelo sem suporte a ferramentas,
> uma chave morta ou um provedor morto é descartado em vez de adicionado. Reexecute a etapa de verificação a qualquer momento;
> as falhas são relatadas, nunca escondidas.

## 🧭 Como funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| Etapa | Chamada | Notas |
| --- | --- | --- |
| caixa de entrada | broker `POST /create` → emailnator → endereço gerado | o painel apenas armazena o endereço; o trilho nunca bloqueia por e-mail |
| registro | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | o código de convite é o que financia a conta |
| login | `POST /api/user/login?turnstile= {username,password}` | `access_token` de volta no corpo |
| conta | `GET /api/user/self` | fornece `id` (→ `New-Api-User`) e a `quota` que prova que o convite funcionou |
| chave | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | a chave em texto simples retorna uma vez |
| verificação | `POST /v1/chat/completions` | 200 ao vivo exigido antes de `keys.txt` |

## ⚙️ Opções do CLI

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --dry             # print the resolved plan, touch nothing
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| Flag | Padrão | Significado |
| --- | --- | --- |
| `--count` | 5 | contas (= chaves) a criar |
| `--auto` | ativado | usa o solucionador de captcha embutido (`--no-auto` opta por não usar; a EasyMax não tem captcha ativo) |
| `--dry` | — | imprime o plano resolvido e sai (sem contas, sem arquivos, sem rede) |
| `--conc` | 1 | contas em andamento ao mesmo tempo (limitado a 16) |
| `--gap` | 1200 | pausa em ms entre rodadas dentro de um worker |
| `--model` | `deepseek-v4.1-flash` | modelo que o portão ao vivo usa |
| `--group` | `deepseek` | grupo de token em que a chave é criada (`default` serve a família gpt) |
| `--aff` | código de convite da frota | código de convite enviado no cadastro — esta é a fonte da cota |
| `--pool <file>` | `proxies.txt` | lista de saídas (env `EASYMAX_PROXIES`) — opcional: sem um pool o CLI se conecta diretamente |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | URL(s) base do broker de caixa de entrada |
| `--inbox <chain>` | `broker,emailnator,local` | ordem do trilho de caixa de entrada |
| `--tries` | 2 | saídas tentadas por conta antes de desistir |
| `--verify-only` | — | reexecuta cada chave em `keys.txt` pelo portão de chat |
| `--screen` | — | testa o pool, grava os sobreviventes em `proxies.live.txt` |

## 🛰️ Atrás de um proxy

Toda requisição à EasyMax passa pela lista de saídas quando uma é fornecida — **uma saída fixada por conta**: as chamadas de registro, login, token e portão de uma conta percorrem todas a mesma linha, e uma saída morta entrega a conta para a próxima do pool (`--tries`). O túnel é embutido: **`http`/`https` CONNECT (com autenticação de proxy `user:pass@`), `socks5` (incluindo usuário/senha) e `socks4a`**.

**Opcional — recomendado em escala (limites por IP, banimentos).** A ferramenta também funciona sem proxy.

- **Com um pool:** passe `--pool <file>` (ou defina `EASYMAX_PROXIES`) — uma saída fixada por conta, como acima.
- **Sem um pool:** o CLI imprime `running WITHOUT a proxy (direct)` e se conecta diretamente; cadastro, criação de chave e portão de chat permanecem inalterados — apenas os pacotes saem da sua própria linha.
- As chamadas ao broker de caixa de entrada vão para `localhost` em ambos os modos, onde seu próprio broker faz sua própria saída.

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `keys.txt` | uma chave chat-200 por linha — ignorado pelo git |
| `keys-ungated.txt` | chaves que falharam na reverificação — tente novamente depois |
| `keys-dead.txt` | chaves que foram criadas mas nunca passaram no portão de chat — material para nova tentativa |
| `src/solver.js` | o módulo de captcha por trás de `--auto` (o Turnstile está desativado neste painel) |
| `accounts.json` | nome de usuário / senha / e-mail / cota / chave / resultado do portão por conta |
| `proxies.txt` | suas saídas, uma por linha — ignorado pelo git |
| `proxies.live.txt` | sobreviventes de `--screen` |

## 🔌 Conectar ao 9Router

[9Router](https://9router.com) é um roteador auto-hospedado e compatível com OpenAI. Um comando transforma `keys.txt` em um nó de provedor com combinações funcionais:

```bash
node src/connect-9router.js
# or: npm run 9router
```

Padrões: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Os modelos são então servidos como `easymax/<model id>` e balanceados entre todas as chaves.

## 🔌 Conectar ao OmniRoute

[OmniRoute](https://omniroute.online) é um roteador auto-hospedado e compatível com OpenAI. Um comando transforma `keys.txt` em um nó de provedor com combinações funcionais:

```bash
node src/connect-omniroute.js
# or: npm run omniroute
```

Padrões: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Os modelos são então servidos como `easymax/<model id>` e balanceados entre todas as chaves.

## 🔑 O que uma chave te dá

| | |
| --- | --- |
| 🏢 Provedor | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 O que o provedor dá | uma conta por chave — o cadastro com código de convite a financia, toda chave verificada por chat |
| 🔑 O que uma chave te dá | uma chave de API limitada à sua própria conta: os 5 ids de modelo no endpoint abaixo, nos limites do seu plano. A cota fica na **conta**, que é exatamente por isso que esta ferramenta cria uma conta por chave |
| 🌐 Formato da API | compatível com OpenAI: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Seus dados | apenas easymax.ai e o backend de caixa de entrada que você configurar são contatados; as chaves ficam na sua máquina |

## 🐞 Problemas

Se o painel mudar o formato do cadastro, remover o bônus de convite ou redefinir seus grupos, a ferramenta para nessa etapa e avisa. **[Abra uma issue](../../issues)** com o comando que você executou e a saída exata; PRs são bem-vindos.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>