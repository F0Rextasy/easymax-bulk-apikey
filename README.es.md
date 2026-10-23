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

**Crea cuentas de EasyMax en masa con claves API autogeneradas — inferencia compatible con OpenAI (DeepSeek V4.1, DeepSeek V4 Pro, familia GPT-6) + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://easymax.ai/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Inicio rápido](#-quick-start) · [🎁 Nivel gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-5-of-them) · [🧪 Usa la API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opciones](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por qué existe esto

EasyMax es un panel de New API con **registro mediante nombre de usuario + contraseña + correo electrónico simples** (Turnstile desactivado, sin verificación por correo) cuya cuota de bienvenida proviene de un **código de invitación**: un registro sin más llega a `quota: 0` y su clave responde `403 用户额度不足`, mientras que el mismo registro con un `aff_code` otorga **250000 de cuota (≈ $0.50) por cuenta** — medido el 2026-10-19, y la razón por la que este rail existe. La unidad que escala es *una cuenta por clave*; la herramienta lo convierte en un `keys.txt` donde **cada línea sobrevivió a una llamada de chat en vivo**, una salida de proxy fijada por cuenta, buzón desde tu propio rail de bandeja de entrada.

## 🎁 Nivel gratuito — cuánto obtienes

**Cada cuenta se financia con el código de invitación que envías al registrarte** — ese es todo el nivel gratuito.

| Qué | Valor |
| --- | --- |
| Cuota de bienvenida | **250000** (≈ $0.50) por cuenta, gastada por token en el grupo de la clave |
| De dónde viene | `POST /api/user/register?turnstile=` con `aff_code=<code>` |
| Sin código de invitación | `quota: 0` → la clave responde `403 用户额度不足` en cada modelo con precio |
| Requiere tarjeta | **No** |
| Captcha | **ninguno** — Turnstile está desactivado en el registro y el inicio de sesión (`?turnstile=` acepta un valor vacío) |
| Verificación por correo | **no requerida** — el panel almacena la dirección y nunca envía un código |
| La unidad que escala | **una cuenta = una clave** → `--count N` en realidad significa "N cuentas financiadas" |

`--aff` usa por defecto el código de invitación propio de la flota; apúntalo al tuyo y cada cuenta que crees te acreditará la comisión del panel (10 % para este panel).

> 💡 El nivel gratuito lo define EasyMax y puede cambiar. Consulta los números en vivo en [easymax.ai](https://easymax.ai) — y deja que la propia puerta de la herramienta decida:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — los 5

El catálogo del panel contiene **101 ids de modelo** (`GET /api/pricing`) repartidos en grupos; el **grupo de token que creas decide qué puede servir una clave**. Los ids marcados abajo se probaron con una llamada de chat real en una cuenta recién creada:

| ID de modelo | Grupo de token | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (predeterminado) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` responde exactamente la lista del grupo: **2 ids** para una clave del grupo `deepseek`, **14 ids** para una clave del grupo `default` (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). El rail crea `--group deepseek` por defecto porque esos ids son los más baratos por token, así que una cuenta con 250000 de cuota dura más con ellos; pasa `--group default` (o cualquier otro nombre de grupo que exponga el panel) para crear una clave para esa familia en su lugar.

## 🧪 Cómo usar la API

La URL base es **`https://easymax.ai/v1`** — compatible con OpenAI, así que cualquier cosa que hable OpenAI funciona (SDKs, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

El id `deepseek-v4-pro` es un modelo de razonamiento: responde primero con `reasoning_content` y con `content` solo después del presupuesto de pensamiento, así que dale un `max_tokens` muy por encima de 100 o verás un `content` vacío.

## 🛠 Inicio rápido

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

Una clave se añade a `keys.txt` **solo** después de que una finalización de chat en vivo la valide; una cuenta que nunca llega a ese punto se registra en `accounts.json` y se reintenta en la siguiente ejecución.

### 🖱️ El lanzador

El lanzador pide la lista de proxies (opcional — sin una, el CLI se ejecuta directamente), la cantidad y el modelo de verificación, los recuerda en `launcher.config.json` y ejecuta el CLI con los flags correctos.

## ✅ Verificado y funcionando — cada clave se prueba

| Comprobación | Resultado |
| --- | --- |
| registro `POST /api/user/register?turnstile=` | **200** `{"success":true}` — con `aff_code`, la cuenta llega a `quota: 250000` |
| inicio de sesión `POST /api/user/login?turnstile=` | **200** — payload de New-API **v2** (`access_token` JWT + sesión) |
| autenticación | `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` en `/api/token/*` |
| clave | `POST /api/token/ {group}` → **200**, luego `POST /api/token/<id>/key` → clave completa |
| puerta de chat — ejecutada para **cada** clave antes de escribirse | **200** con contenido real |
| una clave que falla su comprobación de chat | nunca se escribe en `keys.txt` (la cuenta sigue reutilizable en `accounts.json`) |

Creadas con esta herramienta durante la compilación: **8 cuentas / cada clave, todas `quota 250000`, todas chat-200** en `deepseek-v4.1-flash`, a través de dos tipos de túnel (CONNECT + SOCKS5) y 4 salidas.

> **Puertas de calidad.** Cada clave aquí pasó un `chat-200` en vivo antes de escribirse en `keys.txt`
> (las claves muertas nunca se entregan). Las combinaciones del router siguen la misma regla a nivel de modelo: una entrada se
> añade **solo si el modelo responde `chat-200` y puede llamar herramientas** — un modelo sin soporte de herramientas,
> una clave muerta o un proveedor muerto se descarta en lugar de añadirse. Vuelve a ejecutar el paso de verificación cuando quieras;
> los fallos se reportan, nunca se ocultan.

## 🧭 Cómo funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| Paso | Llamada | Notas |
| --- | --- | --- |
| buzón | broker `POST /create` → emailnator → dirección generada | el panel solo almacena la dirección; el rail nunca se bloquea esperando correo |
| registro | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | el código de invitación es lo que financia la cuenta |
| inicio de sesión | `POST /api/user/login?turnstile= {username,password}` | `access_token` devuelto en el cuerpo |
| cuenta | `GET /api/user/self` | da `id` (→ `New-Api-User`) y la `quota` que prueba que la invitación funcionó |
| clave | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | la clave en texto plano se devuelve una vez |
| comprobación | `POST /v1/chat/completions` | se requiere un 200 en vivo antes de `keys.txt` |

## ⚙️ Opciones del CLI

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| Flag | Predeterminado | Significado |
| --- | --- | --- |
| `--count` | 5 | cuentas (= claves) a crear |
| `--conc` | 1 | cuentas en curso a la vez (limitado a 16) |
| `--gap` | 1200 | pausa en ms entre rondas dentro de un worker |
| `--model` | `deepseek-v4.1-flash` | modelo que usa la puerta en vivo |
| `--group` | `deepseek` | grupo de token en el que se crea la clave (`default` sirve la familia gpt) |
| `--aff` | código de invitación de la flota | código de invitación enviado al registrarse — esta es la fuente de la cuota |
| `--pool <file>` | `proxies.txt` | lista de salidas (env `EASYMAX_PROXIES`) — opcional: sin un pool el CLI se conecta directamente |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | URL(s) base del broker de bandeja de entrada |
| `--inbox <chain>` | `broker,emailnator,local` | orden del rail de buzón |
| `--tries` | 2 | salidas probadas por cuenta antes de abandonarla |
| `--verify-only` | — | vuelve a ejecutar cada clave en `keys.txt` a través de la puerta de chat |
| `--screen` | — | examina el pool, escribe los supervivientes en `proxies.live.txt` |

## 🛰️ Detrás de un proxy

Cada solicitud a EasyMax pasa por la lista de salidas cuando se proporciona una — **una salida fijada por cuenta**: las llamadas de registro, inicio de sesión, token y puerta de una cuenta viajan todas por la misma línea, y una salida muerta pasa la cuenta a la siguiente del pool (`--tries`). El túnel está integrado: **`http`/`https` CONNECT (con autenticación de proxy `user:pass@`), `socks5` (incluido usuario/contraseña) y `socks4a`**.

**Opcional — recomendado a escala (límites por IP, baneos).** La herramienta también funciona sin proxy.

- **Con un pool:** pasa `--pool <file>` (o define `EASYMAX_PROXIES`) — una salida fijada por cuenta, como arriba.
- **Sin un pool:** el CLI imprime `running WITHOUT a proxy (direct)` y se conecta directamente; el registro, la creación de claves y la puerta de chat no cambian — solo que los paquetes salen desde tu propia línea.
- Las llamadas al broker de bandeja de entrada van a `localhost` en ambos modos, donde tu propio broker hace su propia salida.

## 📄 Archivos

| Ruta | Contenido |
| --- | --- |
| `keys.txt` | una clave chat-200 por línea — ignorada por git |
| `keys-ungated.txt` | claves que fallaron la reverificación — reintentar más tarde |
| `accounts.json` | nombre de usuario / contraseña / correo / cuota / clave / resultado de la puerta por cuenta |
| `proxies.txt` | tus salidas, una por línea — ignorada por git |
| `proxies.live.txt` | supervivientes de `--screen` |

## 🔌 Conectar con 9Router

[9Router](https://9router.com) es un router autoalojado y compatible con OpenAI. Un comando convierte `keys.txt` en un nodo proveedor con combinaciones funcionales:

```bash
node src/connect-9router.js
# or: npm run 9router
```

Predeterminados: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Los modelos se sirven entonces como `easymax/<model id>` y se balancean entre todas las claves.

## 🔌 Conectar con OmniRoute

[OmniRoute](https://omniroute.online) es un router autoalojado y compatible con OpenAI. Un comando convierte `keys.txt` en un nodo proveedor con combinaciones funcionales:

```bash
node src/connect-omniroute.js
# or: npm run omniroute
```

Predeterminados: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Los modelos se sirven entonces como `easymax/<model id>` y se balancean entre todas las claves.

## 🔑 Qué te da una clave

| | |
| --- | --- |
| 🏢 Proveedor | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 Qué da el proveedor | una cuenta por clave — el registro con código de invitación la financia, cada clave verificada por chat |
| 🔑 Qué te da una clave | una clave API limitada a su propia cuenta: los 5 ids de modelo en el endpoint de abajo, con los límites de tu plan. La cuota vive en la **cuenta**, que es exactamente por lo que esta herramienta crea una cuenta por clave |
| 🌐 Forma de la API | Compatible con OpenAI: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Tus datos | solo se contacta easymax.ai y el backend de bandeja de entrada que configures; las claves permanecen en tu máquina |

## 🐞 Problemas

Si el panel cambia la forma de su registro, elimina el bono de invitación o recambia sus grupos, la herramienta se detiene en ese paso y lo indica. **[Abre un issue](../../issues)** con el comando que ejecutaste y la salida exacta; los PR son bienvenidos.

## 📄 Licencia

MIT © 2026 — consulta [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>