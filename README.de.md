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

**EasyMax-Konten in großen Mengen erstellen mit automatisch generierten API-Schlüsseln — OpenAI-kompatible Inferenz (DeepSeek V4.1, DeepSeek V4 Pro, GPT-6-Familie) + 9Router-Konnektor.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://easymax.ai/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Kostenlose Stufe](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-5-of-them) · [🧪 Die API nutzen](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 So funktioniert es](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Probleme](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

EasyMax ist ein New-API-Panel mit einer **einfachen Registrierung per Benutzername + Passwort + E-Mail** (keine E-Mail-Verifizierung), dessen Willkommens-Kontingent von einem **Einladungscode** stammt: Eine reine Registrierung landet bei `quota: 0` und der Schlüssel antwortet mit `403 用户额度不足`, während eine Registrierung mit dem `aff_code` eines **aktiven** Kontos **250000 Kontingent (≈ $0,50) pro Konto** gewährt — neu gemessen am 2026-10-24. Dieser Code ist nie in diesem Repository eingebaut: Das Tool registriert ein Seed-Konto und liest den Code aus dem Panel zurück (`GET /api/user/aff`), bevor es Schlüssel erzeugt, denn ein mitgelieferter Code stirbt mit seinem Besitzer (der Flotten-Code, der hier früher lag, zahlt bereits `quota: 0`). Cloudflare Turnstile ist **aktiv** — `src/solver.js` erzeugt ein echtes Token in einem unsichtbaren Chrome über denselben Ausgang, daher sind `npm install` (puppeteer-core) und ein Chrome auf dem Rechner erforderlich. Die Einheit, die skaliert, ist *ein Konto pro Schlüssel*; das Tool macht daraus eine `keys.txt`, in der **jede Zeile einen echten Chat-Aufruf überlebt hat**, ein fest zugewiesener Proxy-Ausgang pro Konto, Postfach aus deiner eigenen Inbox-Schiene.

## 🎁 Kostenlose Stufe — wie viel du bekommst

**Jedes Konto wird durch den Einladungscode finanziert, mit dem es sich registriert — und das Tool holt diesen Code aus dem Panel selbst** — das ist die gesamte kostenlose Stufe.

| Was | Wert |
| --- | --- |
| Willkommens-Kontingent | **250000** (≈ $0,50) pro Konto, pro Token in der Gruppe des Schlüssels verbraucht |
| Woher es kommt | `POST /api/user/register?turnstile=` mit `aff_code=<code>`, wobei `<code>` der **eigene Code eines aktiven Kontos** ist (`GET /api/user/aff`) |
| Ohne Einladungscode | `quota: 0` → der Schlüssel antwortet mit `403 用户额度不足` bei jedem kostenpflichtigen Modell |
| Karte erforderlich | **Nein** |
| Captcha | **Cloudflare Turnstile, aktiv** — ein echtes Token, erzeugt in einem unsichtbaren Chrome über denselben Ausgang (`src/solver.js`; `npm install` + ein Chrome auf dem Rechner) |
| E-Mail-Verifizierung | **nicht erforderlich** — das Panel speichert die Adresse und verschickt nie einen Code |
| Die Einheit, die skaliert | **ein Konto = ein Schlüssel** → `--count N` bedeutet wirklich „N finanzierte Konten" |

`--code <code>` legt den Einladungscode fest (der Code deines eigenen Kontos, der dir auch die Provision des Panels gutschreibt — hier 10 %) und überspringt das Seed-Konto; lässt du es weg, registriert das Tool zuerst ein Seed-Konto und erntet dessen Code, sodass jedes Konto des Durchlaufs mit einem **aktiven** Code finanziert wird.

> 💡 Die kostenlose Stufe wird von EasyMax festgelegt und kann sich ändern. Prüfe die aktuellen Zahlen auf [easymax.ai](https://easymax.ai) — und lass das Gate des Tools selbst entscheiden:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 5 davon

Der Katalog des Panels enthält **101 Modell-IDs** (`GET /api/pricing`), aufgeteilt auf Gruppen; **die Token-Gruppe, die du erzeugst, entscheidet, was ein Schlüssel bedienen kann**. Die unten angehakten IDs wurden mit einem echten Chat-Aufruf auf einem frisch erzeugten Konto getestet:

| Modell-ID | Token-Gruppe | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (Standard) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` antwortet genau mit der Liste der Gruppe: **2 IDs** für einen Schlüssel der Gruppe `deepseek`, **14 IDs** für einen Schlüssel der Gruppe `default` (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). Die Schiene erzeugt standardmäßig `--group deepseek`, weil diese IDs pro Token am günstigsten sind, sodass ein Konto mit 250000 Kontingent damit am längsten hält; übergib `--group default` (oder einen anderen Gruppennamen, den das Panel anbietet), um stattdessen einen Schlüssel für diese Familie zu erzeugen.

## 🧪 Die API nutzen

Die Basis-URL ist **`https://easymax.ai/v1`** — OpenAI-kompatibel, also funktioniert alles, was OpenAI spricht (SDKs, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

Die ID `deepseek-v4-pro` ist ein Reasoning-Modell: Es antwortet zuerst mit `reasoning_content` und `content` erst nach dem Denk-Budget, also gib ihm `max_tokens` deutlich über 100, sonst siehst du ein leeres `content`.

## 🚀 Ein Befehl

```bash
node src/cli.js --count 10
```

Das ist das ganze Tool: ein EasyMax-Konto pro Schlüssel (finanziert durch den Einladungscode, den das Panel zurückgibt), dessen API-Schlüssel erzeugt und **nur** nach einem echten `chat-200` behalten wird. Der Captcha-Schritt ist ebenfalls automatisch — das Panel verwendet Cloudflare Turnstile, und `src/solver.js` (standardmäßig aktiv hinter `--auto`) erzeugt ein echtes Token in einem unsichtbaren Chrome **über denselben Ausgang**, weil das Token an die lösende IP gebunden ist; dafür ist das einmalige `npm install` da. Eine `proxies.txt` neben dem Repository wird automatisch eingelesen (ein fest zugewiesener Ausgang pro Konto); ohne sie läuft der Durchlauf direkt.

`--dry` gibt den aufgelösten Plan aus — Anzahl, Pool-Größe, Solver-Verfügbarkeit, Modelle — und beendet sich, ohne eine einzige Datei anzufassen oder eine Anfrage zu stellen:

```bash
node src/cli.js --dry
```

Lieber ein Menü als Flags? `npm start` (oder `node src/launcher.js`) → **1) Mint keys** → *How many keys? [10]*.

> ⚠️ **Nutzungsbedingungen & Kontorisiko.** Dieses Tool automatisiert die Kontoerstellung und die Ausgabe von API-Schlüsseln gegenüber einem Drittanbieter-Panel. Das kann gegen die Nutzungsbedingungen des Panels verstoßen und dazu führen, dass Konten, Schlüssel oder IPs gesperrt werden. **Automatisierung liegt in deiner eigenen Verantwortung**: Lies die Bedingungen des Anbieters, nutze deine eigene Inbox und Proxys und stelle sicher, dass du das dort, wo du lebst, tun darfst, bevor du es ausführst.

## 🛠 Schnellstart

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

Ein Schlüssel wird **nur** dann an `keys.txt` angehängt, wenn eine echte Chat-Vervollständigung ihn bestätigt; ein Konto, das diesen Punkt nie erreicht, wird in `accounts.json` festgehalten und beim nächsten Durchlauf erneut versucht.

### 🖱️ Der Launcher

`npm start` (oder `node src/launcher.js`) ist die Menüform desselben CLI: **1) Mint keys** → *How many keys? [10]* (Enter akzeptiert 10) führt `node src/cli.js --auto --count N` aus. Es fragt nie nach einem Captcha, einem Token oder einem Proxy — `proxies.txt` wird automatisch verwendet, wenn vorhanden. Es endet mit einer Übersichtstabelle (live/gesamt, Latenz, Fehlerklassen) plus dem Pfad zu `keys.txt`; Schlüssel, die das Gate nicht bestanden haben, landen in `keys-dead.txt`.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

| Prüfung | Ergebnis |
| --- | --- |
| register `POST /api/user/register?turnstile=` | **200** `{"success":true}` — mit einem aktiven `aff_code` landet das Konto bei `quota: 250000` |
| das Turnstile der Registrierung | ein echtes Token ist erforderlich (`Turnstile 校验失败` ohne eines) und wird von genau dem Ausgang erzeugt, der es verbraucht |
| login `POST /api/user/login?turnstile=` | **200** — New-API-**v2**-Payload (`access_token` JWT + Session) |
| auth | `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` auf `/api/token/*` |
| key | `POST /api/token/ {group}` → **200**, dann `POST /api/token/<id>/key` → vollständiger Schlüssel |
| chat gate — für **jeden** Schlüssel ausgeführt, bevor er geschrieben wird | **200** mit echtem Inhalt |
| ein Schlüssel, der seine Chat-Prüfung nicht besteht | wird nie in `keys.txt` geschrieben (das Konto bleibt in `accounts.json` wiederverwendbar) |

Mit diesem Tool während des Builds erzeugt: **8 Konten / jeder Schlüssel, alle `quota 250000`, alle chat-200** auf `deepseek-v4.1-flash`, über zwei Tunneltypen (CONNECT + SOCKS5) und 4 Ausgänge. Neu gemessen am 2026-10-24 über das CLI dieses Repos (`--count 1`, ein WARP-Ausgang): Der eigene Code des Seed-Kontos finanzierte das erzeugte Konto mit `quota 250000` und sein Schlüssel antwortete mit chat-200 auf zwei verschiedene Prompts.

> **Qualitäts-Gates.** Jeder Schlüssel hier hat ein echtes `chat-200` bestanden, bevor er in `keys.txt` geschrieben wurde
> (tote Schlüssel werden nie ausgeliefert). Router-Kombinationen folgen derselben Regel auf Modellebene: Ein Eintrag wird
> **nur hinzugefügt, wenn das Modell `chat-200` antwortet und Tools aufrufen kann** — ein Modell ohne Tool-Unterstützung,
> ein toter Schlüssel oder ein toter Anbieter wird verworfen statt hinzugefügt. Führe den Verifizierungsschritt jederzeit erneut aus;
> Fehler werden gemeldet, nie versteckt.

## 🧭 So funktioniert es

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| Schritt | Aufruf | Hinweise |
| --- | --- | --- |
| captcha | `src/solver.js` — unsichtbares Chrome, fest an den Ausgang des Kontos gebunden | Turnstile ist aktiv und bindet sein Token an die IP, die es verbraucht |
| Einladungscode | ein Seed-Konto → `GET /api/user/aff` | die Antwort des Panels selbst ist der Code, mit dem sich jedes Konto des Durchlaufs registriert (`--code` legt stattdessen einen fest) |
| Postfach | Broker `POST /create` → emailnator → generierte Adresse | das Panel speichert nur die Adresse; die Schiene blockiert nie wegen Mail |
| register | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | der Einladungscode ist es, der das Konto finanziert |
| login | `POST /api/user/login?turnstile= {username,password}` | `access_token` kommt im Body zurück |
| account | `GET /api/user/self` | liefert `id` (→ `New-Api-User`) und das `quota`, das beweist, dass die Einladung funktioniert hat |
| key | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | der Klartext-Schlüssel kommt einmal zurück |
| check | `POST /v1/chat/completions` | echtes 200 erforderlich, bevor `keys.txt` |

## ⚙️ CLI-Optionen

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --dry             # print the resolved plan, touch nothing
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| Flag | Standard | Bedeutung |
| --- | --- | --- |
| `--count` | 5 | zu erzeugende Konten (= Schlüssel) |
| `--auto` | an | den eingebauten Captcha-Solver verwenden (`--no-auto` deaktiviert ihn; der Captcha-Schritt ist automatisch — siehe `src/solver.js`) |
| `--dry` | — | den aufgelösten Plan ausgeben und beenden (keine Konten, keine Dateien, kein Netzwerk) |
| `--conc` | 1 | gleichzeitig laufende Konten (begrenzt auf 16) |
| `--gap` | 1200 | Pause in ms zwischen Runden innerhalb eines Workers |
| `--model` | `deepseek-v4.1-flash` | Modell, das das Live-Gate verwendet |
| `--group` | `deepseek` | Token-Gruppe, in der der Schlüssel erstellt wird (`default` bedient die gpt-Familie) |
| `--code <code>` | aus einem aktiven Seed-Konto gelesen | bei der Registrierung gesendeter Einladungscode — das ist die Kontingent-Quelle |
| `--pool <file>` | `proxies.txt` | Ausgangsliste (Env `EASYMAX_PROXIES`) — optional: ohne Pool verbindet sich das CLI direkt |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | Basis-URL(s) des Inbox-Brokers |
| `--inbox <chain>` | `broker,emailnator,local` | Reihenfolge der Postfach-Schiene |
| `--exits` | 6 | pro Konto versuchte Ausgänge, bevor es aufgegeben wird |
| `--verify-only` | — | jeden Schlüssel in `keys.txt` erneut durch das Chat-Gate laufen lassen |
| `--screen` | — | den Pool prüfen, die Überlebenden in `proxies.live.txt` schreiben |

## 🛰️ Hinter einem Proxy

Jede EasyMax-Anfrage geht durch die Ausgangsliste, wenn eine bereitgestellt wird — **ein fest zugewiesener Ausgang pro Konto**: Die Register-, Login-, Token- und Gate-Aufrufe eines Kontos fahren alle auf derselben Leitung, und ein toter Ausgang übergibt das Konto an den nächsten im Pool (`--exits`). Der Tunnel ist eingebaut: **`http`/`https` CONNECT (mit `user:pass@`-Proxy-Auth), `socks5` (inklusive Benutzer/Passwort) und `socks4a`**.

**Optional — bei Skalierung empfohlen (Limits pro IP, Sperren).** Das Tool funktioniert auch ohne Proxy.

- **Mit einem Pool:** übergib `--pool <file>` (oder setze `EASYMAX_PROXIES`) — ein fest zugewiesener Ausgang pro Konto, wie oben.
- **Ohne einen Pool:** das CLI gibt `running WITHOUT a proxy (direct)` aus und verbindet sich direkt; Registrierung, Schlüsselerzeugung und Chat-Gate bleiben unverändert — nur verlassen die Pakete deine eigene Leitung.
- Aufrufe des Inbox-Brokers gehen in beiden Modi an `localhost`, wo dein eigener Broker seinen eigenen Egress macht.

## 📄 Dateien

| Pfad | Inhalt |
| --- | --- |
| `keys.txt` | ein chat-200-Schlüssel pro Zeile — von Git ignoriert |
| `keys-ungated.txt` | Schlüssel, die die erneute Prüfung nicht bestanden haben — später erneut versuchen |
| `keys-dead.txt` | Schlüssel, die erzeugt wurden, aber das Chat-Gate nie bestanden haben — Wiederholungsmaterial |
| `src/solver.js` | das Captcha-Modul hinter `--auto` — ein echtes Turnstile-Token, erzeugt in einem unsichtbaren Chrome über den Ausgang des Kontos |
| `accounts.json` | Benutzername / Passwort / E-Mail / Kontingent / Schlüssel / Gate-Ergebnis pro Konto |
| `proxies.txt` | deine Ausgänge, einer pro Zeile — von Git ignoriert |
| `proxies.live.txt` | Überlebende von `--screen` |

## 🔌 Mit 9Router verbinden

[9Router](https://9router.com) ist ein selbst gehosteter, OpenAI-kompatibler Router. Ein Befehl macht aus `keys.txt` einen Provider-Node mit funktionierenden Kombinationen:

```bash
node src/connect-9router.js
# or: npm run 9router
```

Standardwerte: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Modelle werden dann als `easymax/<model id>` bereitgestellt und über jeden Schlüssel lastverteilt.

## 🔌 Mit OmniRoute verbinden

[OmniRoute](https://omniroute.online) ist ein selbst gehosteter, OpenAI-kompatibler Router. Ein Befehl macht aus `keys.txt` einen Provider-Node mit funktionierenden Kombinationen:

```bash
node src/connect-omniroute.js
# or: npm run omniroute
```

Standardwerte: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Modelle werden dann als `easymax/<model id>` bereitgestellt und über jeden Schlüssel lastverteilt.

## 🔑 Was ein Schlüssel dir bringt

| | |
| --- | --- |
| 🏢 Anbieter | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 Was der Anbieter gibt | ein Konto pro Schlüssel — die Registrierung per Einladungscode finanziert es, jeder Schlüssel chat-verifiziert |
| 🔑 Was ein Schlüssel dir bringt | einen API-Schlüssel, der auf sein eigenes Konto beschränkt ist: die 5 Modell-IDs am unten stehenden Endpunkt, im Rahmen der Limits deines Plans. Das Kontingent liegt auf dem **Konto**, weshalb dieses Tool genau ein Konto pro Schlüssel erstellt |
| 🌐 API-Form | OpenAI-kompatibel: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Deine Daten | nur easymax.ai und das von dir konfigurierte Inbox-Backend werden kontaktiert; Schlüssel bleiben auf deinem Rechner |

## 🐞 Probleme

Wenn das Panel die Form seiner Registrierung ändert, den Einladungsbonus streicht oder seine Gruppen neu verschlüsselt, stoppt das Tool an diesem Schritt und sagt es. **[Öffne ein Issue](../../issues)** mit dem ausgeführten Befehl und der genauen Ausgabe; PRs sind willkommen.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>