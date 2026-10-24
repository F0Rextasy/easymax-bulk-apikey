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

**Créez en masse des comptes EasyMax avec des clés API générées automatiquement — inférence compatible OpenAI (DeepSeek V4.1, DeepSeek V4 Pro, famille GPT-6) + connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://easymax.ai/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Offre gratuite](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-5-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi cet outil existe

EasyMax est un panneau New API avec une **inscription par simple nom d'utilisateur + mot de passe + e-mail** (sans vérification d'e-mail) dont le quota de bienvenue provient d'un **code d'invitation** : une inscription sans code aboutit à `quota: 0` et sa clé répond `403 用户额度不足`, tandis qu'une inscription portant le `aff_code` d'un compte **actif** accorde **250000 de quota (≈ 0,50 $) par compte** — remesuré le 2026-10-24. Ce code n'est jamais intégré à ce dépôt : l'outil enregistre un compte germe et relit le code depuis le panneau (`GET /api/user/aff`) avant de générer, car un code livré meurt avec son propriétaire (le code de flotte qui se trouvait ici paie déjà `quota: 0`). Cloudflare Turnstile est **activé** — `src/solver.js` génère un vrai jeton dans un Chrome hors écran via la même sortie, donc `npm install` (puppeteer-core) et un Chrome sur la machine sont requis. L'unité qui s'adapte est *un compte par clé* ; l'outil transforme cela en un `keys.txt` où **chaque ligne a survécu à un appel de chat en direct**, une sortie proxy épinglée par compte, une boîte mail issue de votre propre rail de réception.

## 🎁 Offre gratuite — ce que vous obtenez

**Chaque compte est financé par le code d'invitation avec lequel il s'inscrit — et l'outil récupère ce code depuis le panneau lui-même** — voilà toute l'offre gratuite.

| Élément | Valeur |
| --- | --- |
| Quota de bienvenue | **250000** (≈ 0,50 $) par compte, dépensé par jeton sur le groupe de la clé |
| D'où il vient | `POST /api/user/register?turnstile=` avec `aff_code=<code>`, où `<code>` est le **code propre d'un compte actif** (`GET /api/user/aff`) |
| Sans code d'invitation | `quota: 0` → la clé répond `403 用户额度不足` sur chaque modèle payant |
| Carte requise | **Non** |
| Captcha | **Cloudflare Turnstile, activé** — un vrai jeton, généré dans un Chrome hors écran via la même sortie (`src/solver.js` ; `npm install` + un Chrome sur la machine) |
| Vérification d'e-mail | **non requise** — le panneau stocke l'adresse et n'envoie jamais de code |
| L'unité qui s'adapte | **un compte = une clé** → `--count N` signifie en réalité « N comptes financés » |

`--code <code>` épingle le code d'invitation (le code de votre propre compte, qui vous crédite aussi la commission du panneau — 10 % ici) et saute le compte germe ; si vous l'omettez, l'outil enregistre d'abord un compte germe et récolte son code, de sorte que chaque compte de l'exécution est financé sur un code **actif**.

> 💡 L'offre gratuite est définie par EasyMax et peut changer. Consultez les chiffres en direct sur [easymax.ai](https://easymax.ai) — et laissez le propre contrôle de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 5 au complet

Le catalogue du panneau contient **101 identifiants de modèles** (`GET /api/pricing`) répartis en groupes ; **le groupe de jetons que vous générez détermine ce qu'une clé peut servir**. Les identifiants cochés ci-dessous ont été exécutés via un véritable appel de chat sur un compte fraîchement créé :

| Identifiant du modèle | Groupe de jetons | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (par défaut) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` renvoie exactement la liste du groupe : **2 identifiants** pour une clé du groupe `deepseek`, **14 identifiants** pour une clé du groupe `default` (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). Le rail génère `--group deepseek` par défaut car ces identifiants sont les moins chers par jeton, donc un compte à 250000 de quota dure le plus longtemps avec eux ; passez `--group default` (ou tout autre nom de groupe exposé par le panneau) pour générer à la place une clé pour cette famille.

## 🧪 Comment utiliser l'API

L'URL de base est **`https://easymax.ai/v1`** — compatible OpenAI, donc tout ce qui parle OpenAI fonctionne (SDK, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

L'identifiant `deepseek-v4-pro` est un modèle de raisonnement : il répond d'abord avec `reasoning_content` et `content` seulement après le budget de réflexion, donc donnez-lui un `max_tokens` bien supérieur à 100, sinon vous verrez un `content` vide.

## 🚀 Une seule commande

```bash
node src/cli.js --count 10
```

Voilà tout l'outil : un compte EasyMax par clé (financé par le code d'invitation que le panneau renvoie), sa clé API générée et conservée **uniquement** après un `chat-200` en direct. L'étape de captcha est automatique aussi — le panneau exécute Cloudflare Turnstile, et `src/solver.js` (activé par défaut derrière `--auto`) génère un vrai jeton dans un Chrome hors écran **via la même sortie**, car le jeton est lié à l'IP qui le résout ; c'est à cela que sert le `npm install` unique. Un `proxies.txt` à côté du dépôt est pris en compte automatiquement (une sortie épinglée par compte) ; sans lui, l'exécution se fait en direct.

`--dry` affiche le plan résolu — nombre, taille du pool, disponibilité du solveur, modèles — et se termine sans toucher un seul fichier ni faire de requête :

```bash
node src/cli.js --dry
```

Vous préférez un menu aux options ? `npm start` (ou `node src/launcher.js`) → **1) Générer des clés** → *Combien de clés ? [10]*.

> ⚠️ **Conditions et risque de compte.** Cet outil automatise la création de comptes et l'émission de clés API contre un panneau tiers. Cela peut enfreindre les conditions d'utilisation du panneau et entraîner le bannissement de comptes, de clés ou d'IP. **L'automatisation est votre propre responsabilité** : lisez les conditions du fournisseur, utilisez votre propre boîte mail et vos propres proxys, et assurez-vous d'être autorisé à le faire là où vous vivez avant de l'exécuter.

## 🛠 Démarrage rapide

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

Une clé n'est ajoutée à `keys.txt` **qu'**après qu'une complétion de chat en direct l'a prouvée ; un compte qui n'atteint jamais ce point est enregistré dans `accounts.json` et réessayé à l'exécution suivante.

### 🖱️ Le lanceur

`npm start` (ou `node src/launcher.js`) est la forme menu du même CLI : **1) Générer des clés** → *Combien de clés ? [10]* (Entrée accepte 10) exécute `node src/cli.js --auto --count N`. Il ne demande jamais de captcha, de jeton ou de proxy — `proxies.txt` est utilisé automatiquement lorsqu'il est présent. Il se termine par un tableau récapitulatif (actives/total, latence, classes d'erreurs) ainsi que le chemin de `keys.txt` ; les clés qui ont échoué au contrôle atterrissent dans `keys-dead.txt`.

## ✅ Vérifié fonctionnel — chaque clé est testée

| Contrôle | Résultat |
| --- | --- |
| inscription `POST /api/user/register?turnstile=` | **200** `{"success":true}` — avec un `aff_code` actif, le compte aboutit à `quota: 250000` |
| le Turnstile de l'inscription | un vrai jeton est requis (`Turnstile 校验失败` sans lui) et est généré depuis la sortie même qui le dépense |
| connexion `POST /api/user/login?turnstile=` | **200** — charge utile New-API **v2** (`access_token` JWT + session) |
| authentification | `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` sur `/api/token/*` |
| clé | `POST /api/token/ {group}` → **200**, puis `POST /api/token/<id>/key` → clé complète |
| contrôle de chat — exécuté pour **chaque** clé avant son écriture | **200** avec du contenu réel |
| une clé qui échoue à son contrôle de chat | jamais écrite dans `keys.txt` (le compte reste réutilisable dans `accounts.json`) |

Générées avec cet outil pendant la construction : **8 comptes / chaque clé, toutes `quota 250000`, toutes chat-200** sur `deepseek-v4.1-flash`, à travers deux types de tunnel (CONNECT + SOCKS5) et 4 sorties. Remesuré le 2026-10-24 via le propre CLI de ce dépôt (`--count 1`, une sortie WARP) : le code propre du compte germe a financé le compte généré avec `quota 250000` et sa clé a répondu chat-200 sur deux invites différentes.

> **Contrôles de qualité.** Chaque clé ici a passé un `chat-200` en direct avant d'être écrite dans `keys.txt`
> (les clés mortes ne sont jamais livrées). Les combos de routeur suivent la même règle au niveau du modèle : une entrée n'est
> ajoutée **que si le modèle répond `chat-200` et peut appeler des outils** — un modèle sans prise en charge des outils,
> une clé morte ou un fournisseur mort est écarté au lieu d'être ajouté. Relancez l'étape de vérification à tout moment ;
> les échecs sont signalés, jamais masqués.

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| Étape | Appel | Remarques |
| --- | --- | --- |
| captcha | `src/solver.js` — Chrome hors écran, épinglé à la sortie du compte | Turnstile est activé et lie son jeton à l'IP qui le dépense |
| code d'invitation | un compte germe → `GET /api/user/aff` | la réponse du panneau lui-même est le code avec lequel chaque compte de l'exécution s'inscrit (`--code` en épingle un à la place) |
| boîte mail | broker `POST /create` → emailnator → adresse générée | le panneau ne fait que stocker l'adresse ; le rail ne bloque jamais sur le courrier |
| inscription | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | le code d'invitation est ce qui finance le compte |
| connexion | `POST /api/user/login?turnstile= {username,password}` | `access_token` renvoyé dans le corps |
| compte | `GET /api/user/self` | donne `id` (→ `New-Api-User`) et le `quota` qui prouve que l'invitation a fonctionné |
| clé | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | la clé en clair est renvoyée une seule fois |
| contrôle | `POST /v1/chat/completions` | 200 en direct requis avant `keys.txt` |

## ⚙️ Options du CLI

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --dry             # print the resolved plan, touch nothing
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| Option | Défaut | Signification |
| --- | --- | --- |
| `--count` | 5 | comptes (= clés) à générer |
| `--auto` | activé | utiliser le solveur de captcha intégré (`--no-auto` le désactive ; l'étape de captcha est automatique — voir `src/solver.js`) |
| `--dry` | — | afficher le plan résolu et quitter (aucun compte, aucun fichier, aucun réseau) |
| `--conc` | 1 | comptes en cours simultanément (plafonné à 16) |
| `--gap` | 1200 | pause en ms entre les tours au sein d'un worker |
| `--model` | `deepseek-v4.1-flash` | modèle utilisé par le contrôle en direct |
| `--group` | `deepseek` | groupe de jetons dans lequel la clé est créée (`default` sert la famille gpt) |
| `--code <code>` | lu depuis un compte germe actif | code d'invitation envoyé à l'inscription — c'est la source du quota |
| `--pool <file>` | `proxies.txt` | liste de sorties (env `EASYMAX_PROXIES`) — facultatif : sans pool, le CLI se connecte directement |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | URL(s) de base du broker de boîtes mail |
| `--inbox <chain>` | `broker,emailnator,local` | ordre du rail de boîtes mail |
| `--exits` | 6 | sorties essayées par compte avant abandon |
| `--verify-only` | — | relancer chaque clé de `keys.txt` via le contrôle de chat |
| `--screen` | — | filtrer le pool, écrire les survivants dans `proxies.live.txt` |

## 🛰️ Derrière un proxy

Chaque requête EasyMax passe par la liste de sorties lorsqu'une est fournie — **une sortie épinglée par compte** : les appels d'inscription, de connexion, de jeton et de contrôle d'un compte passent tous par la même ligne, et une sortie morte transmet le compte à la suivante du pool (`--exits`). Le tunnel est intégré : **`http`/`https` CONNECT (avec authentification proxy `user:pass@`), `socks5` (y compris user/pass) et `socks4a`**.

**Facultatif — recommandé à grande échelle (limites par IP, bannissements).** L'outil fonctionne aussi sans proxy.

- **Avec un pool :** passez `--pool <file>` (ou définissez `EASYMAX_PROXIES`) — une sortie épinglée par compte, comme ci-dessus.
- **Sans pool :** le CLI affiche `running WITHOUT a proxy (direct)` et se connecte directement ; l'inscription, la génération de clés et le contrôle de chat sont inchangés — seuls les paquets partent de votre propre ligne.
- Les appels au broker de boîtes mail vont vers `localhost` dans les deux modes, où votre propre broker effectue sa propre sortie.

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | une clé chat-200 par ligne — ignoré par git |
| `keys-ungated.txt` | clés qui ont échoué à la re-vérification — à réessayer plus tard |
| `keys-dead.txt` | clés générées mais n'ayant jamais passé le contrôle de chat — matière à réessayer |
| `src/solver.js` | le module de captcha derrière `--auto` — un vrai jeton Turnstile, généré dans un Chrome hors écran via la sortie du compte |
| `accounts.json` | nom d'utilisateur / mot de passe / e-mail / quota / clé / résultat du contrôle par compte |
| `proxies.txt` | vos sorties, une par ligne — ignoré par git |
| `proxies.live.txt` | survivants de `--screen` |

## 🔌 Connexion à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé compatible OpenAI. Une commande transforme `keys.txt` en un nœud fournisseur avec des combos fonctionnels :

```bash
node src/connect-9router.js
# or: npm run 9router
```

Valeurs par défaut : `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Les modèles sont alors servis sous `easymax/<model id>` et répartis en charge sur chaque clé.

## 🔌 Connexion à OmniRoute

[OmniRoute](https://omniroute.online) est un routeur auto-hébergé compatible OpenAI. Une commande transforme `keys.txt` en un nœud fournisseur avec des combos fonctionnels :

```bash
node src/connect-omniroute.js
# or: npm run omniroute
```

Valeurs par défaut : `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Les modèles sont alors servis sous `easymax/<model id>` et répartis en charge sur chaque clé.

## 🔑 Ce qu'une clé vous donne

| | |
| --- | --- |
| 🏢 Fournisseur | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 Ce que le fournisseur donne | un compte par clé — l'inscription par code d'invitation le finance, chaque clé vérifiée par chat |
| 🔑 Ce qu'une clé vous donne | une clé API limitée à son propre compte : les 5 identifiants de modèles sur le point de terminaison ci-dessous, aux limites de votre offre. Le quota réside sur le **compte**, ce qui explique précisément pourquoi cet outil crée un compte par clé |
| 🌐 Forme de l'API | Compatible OpenAI : `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Vos données | seuls easymax.ai et le backend de boîtes mail que vous configurez sont contactés ; les clés restent sur votre machine |

## 🐞 Problèmes

Si le panneau modifie la forme de son inscription, supprime le bonus d'invitation ou change les clés de ses groupes, l'outil s'arrête à cette étape et le signale. **[Ouvrez un ticket](../../issues)** avec la commande que vous avez exécutée et la sortie exacte ; les PR sont les bienvenues.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>