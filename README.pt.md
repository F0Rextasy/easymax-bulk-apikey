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

EasyMax é um painel New API com **cadastro simples por nome de usuário + senha + e-mail** (sem verificação de e-mail) cuja cota de boas-vindas vem de um **código de convite**: um cadastro sem código chega a `quota: 0` e sua chave responde `403 用户额度不足`, enquanto um registro que carrega o `aff_code` de uma conta **ativa** concede **250000 de cota (≈ $0.50) por conta** — remedido em 2026-10-24. Esse código nunca é embutido neste repositório: a ferramenta registra uma conta semente e lê o código de volta do painel (`GET /api/user/aff`) antes de cunhar, porque um código embutido morre com seu dono (o código de frota que costumava ficar aqui já paga `quota: 0`). O Cloudflare Turnstile está **ativado** — `src/solver.js` cunha um token real em um Chrome offscreen pela mesma saída, então `npm install` (puppeteer-core) e um Chrome na máquina são necessários. A unidade que escala é *uma conta por chave*; a ferramenta transforma isso em um `keys.txt` onde **cada linha sobreviveu a uma chamada de chat ao vivo**, uma saída de proxy fixada por conta, caixa de entrada do seu próprio trilho de inbox.

## 🎁 Nível gratuito — quanto você recebe

**Cada conta é financiada pelo código de convite com que se registra — e a ferramenta pega esse código do próprio painel** — esse é todo o nível gratuito.

| O quê | Valor |
| --- | --- |
| Cota de boas-vindas | **250000** (≈ $0.50) por conta, gasta por token no grupo da chave |
| De onde vem | `POST /api/user/register?turnstile=` com `aff_code=<code>`, onde `<code>` é o **código da própria conta ativa** (`GET /api/user/aff`) |
| Sem código de convite | `quota: 0` → a chave responde `403 用户额度不足` em todo modelo pago |
| Cartão exigido | **Não** |
| Captcha | **Cloudflare Turnstile, ativado** — um token real, cunhado em um Chrome offscreen pela mesma saída (`src/solver.js`; `npm install` + um Chrome na máquina) |
| Verificação de e-mail | **não exigida** — o painel armazena o endereço e nunca envia um código |
| A unidade que escala | **uma conta = uma chave** → `--count N` é na verdade "N contas financiadas" |

`--code <code>` fixa o código de convite (o código da sua própria conta, que também credita a você a comissão do painel — 10 % aqui) e pula a conta semente; deixe de fora e a ferramenta registra primeiro uma conta semente e colhe seu código, então cada conta da execução é financiada por um código **ativo**.

> 💡 O nível gratuito é definido pela EasyMax e pode mudar. Confira os números ao vivo em [easymax.ai](https://easymax.ai) — e deixe o próprio portão da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 5

O catálogo do painel carrega **101 ids de modelo** (`GET /api/pricing`) divididos em grupos; o **grupo de token que você cunha decide o que uma chave pode servir**. Os ids marcados abaixo foram executados por uma chamada de chat real em uma conta recém-cunhada:

| ID do modelo | Grupo de token | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (padrão) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` responde exatamente a lista do grupo: **2 ids** para uma chave do grupo `deepseek`, **14 ids** para uma chave do grupo `default` (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). O trilho cunha `--group deepseek` por padrão porque esses ids são os mais baratos por token, então uma conta com 250000 de cota dura mais com eles; passe `--group default` (ou qualquer outro nome de grupo que o painel exponha) para cunhar uma chave para essa família em vez disso.

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

Essa é a ferramenta inteira: uma conta EasyMax por chave (financiada pelo código de convite que o painel devolve), sua chave de API cunhada e mantida **somente** após um `chat-200` ao vivo. A etapa de captcha também é automática — o painel executa Cloudflare Turnstile, e `src/solver.js` (ativado por padrão atrás de `--auto`) cunha um token real em um Chrome offscreen **pela mesma saída**, porque o token está vinculado ao IP que o resolve; é para isso que serve o `npm install` único. Um `proxies.txt` ao lado do repositório é detectado automaticamente (uma saída fixada por conta); sem ele, a execução vai direto.

`--dry` imprime o plano resolvido — contagem, tamanho do pool, disponibilidade do solver, modelos — e sai sem tocar em um único arquivo ou fazer uma requisição:

```bash
node src/cli.js --dry
```

Prefere um menu a flags? `npm start` (ou `node src/launcher.js`) → **1) Mint keys** → *How many keys? [10]*.

> ⚠️ **Termos e risco de conta.** Esta ferramenta automatiza a criação de contas e a emissão de chaves de API contra um painel de terceiros. Isso pode violar os Termos de Serviço do painel e pode levar ao banimento de contas, chaves ou IPs. **A automação é de sua própria responsabilidade**: leia os termos do provedor, use sua própria caixa de entrada e proxies, e certifique-se de que você tem permissão para fazer isso onde mora antes de executar.

## 🛠 Início rápido

```bash

# clone or fork this repository, then:
cd easymax-bulk-apikey

# 1) dependencies for the captcha step (puppeteer-core — bring a Chrome on the machine)
npm install

# 2) your proxy list, one per line (http://…, socks5://… or socks4a://…) — optional
printf 'http://127.0.0.1:8080\n' > proxies.txt   # optional — without it the tool runs direct

# 3) go — one command
node src/cli.js --count 50
# or the menu:  node src/launcher.js        (interactive)
```

Uma chave é anexada a `keys.txt` **somente** após uma conclusão de chat ao vivo prová-la; uma conta que nunca chega a esse ponto é registrada em `accounts.json` e tentada novamente na próxima execução.

### 🖱️ O launcher

`npm start` (ou `node src/launcher.js`) é a forma de menu do mesmo CLI: **1) Mint keys** → *How many keys? [10]* (Enter aceita 10) executa `node src/cli.js --auto --count N`. Ele nunca pergunta sobre captcha, token ou proxy — `proxies.txt` é usado automaticamente quando presente. Ele termina com uma tabela de resumo (ativas/total, latência, classes de erro) mais o caminho de `keys.txt`; chaves que falharam no portão vão para `keys-dead.txt`.

## ✅ Verificado e funcionando — toda chave é testada

| Verificação | Resultado |
| --- | --- |
| register `POST /api/user/register?turnstile=` | **200** `{"success":true}` — com um `aff_code` ativo, a conta chega a `quota: 250000` |
| o Turnstile do registro | um token real é exigido (`Turnstile 校验失败` sem um) e é cunhado exatamente pela saída que o gasta |
| login `POST /api/user/login?turnstile=` | **200** — payload New-API **v2** (`access_token` JWT + sessão) |
| auth | `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` em `/api/token/*` |
| chave | `POST /api/token/ {group}` → **200**, depois `POST /api/token/<id>/key` → chave completa |
| portão de chat — executado para **toda** chave antes de ser gravada | **200** com conteúdo real |
| uma chave que falha na verificação de chat | nunca gravada em `keys.txt` (a conta permanece reutilizável em `accounts.json`) |

Cunhadas com esta ferramenta durante a construção: **8 contas / toda chave, todas `quota 250000`, todas chat-200** em `deepseek-v4.1-flash`, através de dois tipos de túnel (CONNECT + SOCKS5) e 4 saídas. Remedido em 2026-10-24 pelo próprio CLI deste repositório (`--count 1`, uma saída WARP): o próprio código da conta semente financiou a conta cunhada com `quota 250000` e sua chave respondeu chat-200 em dois prompts diferentes.

> **Portões de qualidade.** Toda chave aqui passou por um `chat-200` ao vivo antes de ser gravada em `keys.txt`
> (chaves mortas nunca são entregues). Os combos do roteador seguem a mesma regra no nível do modelo: uma entrada é
> adicionada **somente se o modelo responder `chat-200` e puder chamar ferramentas** — um modelo sem suporte a ferramentas,
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
| captcha | `src/solver.js` — Chrome offscreen, fixado à saída da conta | O Turnstile está ativado e vincula seu token ao IP que o gasta |
| código de convite | uma conta semente → `GET /api/user/aff` | a própria resposta do painel é o código com que cada conta da execução se registra (`--code` fixa um em vez disso) |
| caixa de entrada | broker `POST /create` → emailnator → endereço gerado | o painel apenas armazena o endereço; o trilho nunca bloqueia esperando e-mail |
| registro | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | o código de convite é o que financia a conta |
| login | `POST /api/user/login?turnstile= {username,password}` | `access_token` de volta no corpo |
| conta | `GET /api/user/self` | fornece `id` (→ `New-Api-User`) e a `quota` que prova que o convite funcionou |
| chave | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | a chave em texto simples volta uma vez |
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
| `--count` | 5 | contas (= chaves) a cunhar |
| `--auto` | ativado | usa o solver de captcha embutido (`--no-auto` opta por não usar; a etapa de captcha é automática — veja `src/solver.js`) |
| `--dry` | — | imprime o plano resolvido e sai (sem contas, sem arquivos, sem rede) |
| `--conc` | 1 | contas em andamento ao mesmo tempo (limitado a 16) |
| `--gap` | 1200 | pausa em ms entre rodadas dentro de um worker |
| `--model` | `deepseek-v4.1-flash` | modelo que o portão ao vivo usa |
| `--group` | `deepseek` | grupo de token em que a chave é criada (`default` serve a família gpt) |
| `--code <code>` | lido de uma conta semente ativa | código de convite enviado no cadastro — esta é a fonte da cota |
| `--pool <file>` | `proxies.txt` | lista de saídas (env `EASYMAX_PROXIES`) — opcional: sem um pool o CLI se conecta diretamente |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | URL(s) base do broker de caixa de entrada |
| `--inbox <chain>` | `broker,emailnator,local` | ordem do trilho de caixa de entrada |
| `--exits` | 6 | saídas tentadas por conta antes de desistir |
| `--verify-only` | — | reexecuta toda chave em `keys.txt` pelo portão de chat |
| `--screen` | — | triagem do pool, grava os sobreviventes em `proxies.live.txt` |

## 🛰️ Atrás de um proxy

Toda requisição EasyMax passa pela lista de saídas quando uma é fornecida — **uma saída fixada por conta**: as chamadas de registro, login, token e portão de uma conta todas trafegam pela mesma linha, e uma saída morta entrega a conta para a próxima do pool (`--exits`). O túnel é embutido: **`http`/`https` CONNECT (com autenticação de proxy `user:pass@`), `socks5` (incluindo user/pass) e `socks4a`**.

**Opcional — recomendado em escala (limites por IP, banimentos).** A ferramenta funciona sem proxy também.

- **Com um pool:** passe `--pool <file>` (ou defina `EASYMAX_PROXIES`) — uma saída fixada por conta, como acima.
- **Sem um pool:** o CLI imprime `running WITHOUT a proxy (direct)` e se conecta diretamente; cadastro, cunhagem de chave e portão de chat permanecem inalterados — apenas os pacotes saem pela sua própria linha.
- As chamadas ao broker de caixa de entrada vão para `localhost` em ambos os modos, onde seu próprio broker faz sua própria saída.

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `keys.txt` | uma chave chat-200 por linha — ignorado pelo git |
| `keys-ungated.txt` | chaves que falharam na reverificação — tente novamente depois |
| `keys-dead.txt` | chaves que foram cunhadas mas nunca passaram no portão de chat — material para nova tentativa |
| `src/solver.js` | o módulo de captcha atrás de `--auto` — um token Turnstile real, cunhado em um Chrome offscreen pela saída da conta |
| `accounts.json` | nome de usuário / senha / e-mail / cota / chave / resultado do portão por conta |
| `proxies.txt` | suas saídas, uma por linha — ignorado pelo git |
| `proxies.live.txt` | sobreviventes de `--screen` |

## 🔌 Conectar ao 9Router

[9Router](https://9router.com) é um roteador auto-hospedado e compatível com OpenAI. Um comando transforma `keys.txt` em um nó provedor com combos funcionais:

```bash
node src/connect-9router.js
# or: npm run 9router
```

Padrões: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Os modelos são então servidos como `easymax/<model id>` e balanceados entre todas as chaves.

## 🔌 Conectar ao OmniRoute

[OmniRoute](https://omniroute.online) é um roteador auto-hospedado e compatível com OpenAI. Um comando transforma `keys.txt` em um nó provedor com combos funcionais:

```bash
node src/connect-omniroute.js
# or: npm run omniroute
```

Padrões: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Os modelos são então servidos como `easymax/<model id>` e balanceados entre todas as chaves.

## 🔑 O que uma chave te dá

| | |
| --- | --- |
| 🏢 Provedor | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 O que o provedor dá | uma conta por chave — o cadastro por código de convite a financia, toda chave verificada por chat |
| 🔑 O que uma chave te dá | uma chave de API limitada à sua própria conta: os 5 ids de modelo no endpoint abaixo, nos limites do seu plano. A cota vive na **conta**, que é exatamente por isso que esta ferramenta cria uma conta por chave |
| 🌐 Formato da API | Compatível com OpenAI: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Seus dados | apenas easymax.ai e o backend de caixa de entrada que você configurar são contatados; as chaves ficam na sua máquina |

## 🐞 Problemas

Se o painel mudar o formato do cadastro, remover o bônus de convite ou reconfigurar seus grupos, a ferramenta para nessa etapa e avisa. **[Abra uma issue](../../issues)** com o comando que você executou e a saída exata; PRs são bem-vindos.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>