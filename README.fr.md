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
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Niveau gratuit](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-5-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi ce projet existe

EasyMax est un panneau New API avec une **inscription simple par nom d'utilisateur + mot de passe + e-mail** (Turnstile désactivé, pas de vérification par e-mail) dont le quota de bienvenue provient d'un **code d'invitation** : une inscription sans code aboutit à `quota: 0` et sa clé répond `403 用户额度不足`, tandis que la même inscription avec un `aff_code` accorde **250000 de quota (≈ 0,50 $) par compte** — mesuré le 2026-10-19, et c'est la raison d'être de ce rail. L'unité qui passe à l'échelle est *un compte par clé* ; l'outil transforme cela en un `keys.txt` où **chaque ligne a survécu à un appel de chat en direct**, une sortie proxy épinglée par compte, la boîte mail issue de votre propre rail de boîtes de réception.

## 🎁 Niveau gratuit — ce que vous obtenez

**Chaque compte est financé par le code d'invitation que vous envoyez à l'inscription** — c'est tout le niveau gratuit.

| Élément | Valeur |
| --- | --- |
| Quota de bienvenue | **250000** (≈ 0,50 $) par compte, consommé par token sur le groupe de la clé |
| D'où il vient | `POST /api/user/register?turnstile=` avec `aff_code=<code>` |
| Sans code d'invitation | `quota: 0` → la clé répond `403 用户额度不足` sur chaque modèle payant |
| Carte requise | **Non** |
| Captcha | **aucun** — Turnstile est désactivé à l'inscription et à la connexion (`?turnstile=` accepte une valeur vide) |
| Vérification par e-mail | **non requise** — le panneau stocke l'adresse et n'envoie jamais de code |
| L'unité qui passe à l'échelle | **un compte = une clé** → `--count N` signifie en réalité « N comptes financés » |

`--aff` utilise par défaut le code d'invitation de la flotte ; pointez-le vers le vôtre et chaque compte que vous créez vous crédite la commission du panneau (10 % pour ce panneau).

> 💡 Le niveau gratuit est défini par EasyMax et peut changer. Consultez les chiffres en direct sur [easymax.ai](https://easymax.ai) — et laissez la barrière de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 5 au complet

Le catalogue du panneau contient **101 identifiants de modèles** (`GET /api/pricing`) répartis en groupes ; **le groupe de tokens que vous créez détermine ce qu'une clé peut servir**. Les identifiants cochés ci-dessous ont été exécutés via un véritable appel de chat sur un compte fraîchement créé :

| Identifiant du modèle | Groupe de tokens | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (par défaut) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` renvoie exactement la liste du groupe : **2 identifiants** pour une clé du groupe `deepseek`, **14 identifiants** pour une clé du groupe `default` (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). Le rail crée par défaut `--group deepseek` car ces identifiants sont les moins chers par token, donc un compte à 250000 de quota dure le plus longtemps avec eux ; passez `--group default` (ou tout autre nom de groupe exposé par le panneau) pour créer à la place une clé pour cette famille.

## 🧪 Comment utiliser l'API

L'URL de base est **`https://easymax.ai/v1`** — compatible OpenAI, donc tout ce qui parle OpenAI fonctionne (SDK, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

L'identifiant `deepseek-v4-pro` est un modèle de raisonnement : il répond d'abord avec `reasoning_content` et `content` seulement après le budget de réflexion, donc donnez-lui un `max_tokens` bien supérieur à 100, sinon vous verrez un `content` vide.

## 🛠 Démarrage rapide

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

Une clé n'est ajoutée à `keys.txt` **qu'**après qu'une complétion de chat en direct l'a prouvée ; un compte qui n'atteint jamais ce point est enregistré dans `accounts.json` et réessayé au prochain lancement.

### 🖱️ Le lanceur

Le lanceur demande la liste de proxys, le nombre et le modèle de vérification, les mémorise dans `launcher.config.json`, et exécute le CLI avec les bons drapeaux.

## ✅ Vérifié fonctionnel — chaque clé est testée

| Vérification | Résultat |
| --- | --- |
| inscription `POST /api/user/register?turnstile=` | **200** `{"success":true}` — avec `aff_code`, le compte aboutit à `quota: 250000` |
| connexion `POST /api/user/login?turnstile=` | **200** — charge utile New-API **v2** (`access_token` JWT + session) |
| authentification | `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` sur `/api/token/*` |
| clé | `POST /api/token/ {group}` → **200**, puis `POST /api/token/<id>/key` → clé complète |
| barrière de chat — exécutée pour **chaque** clé avant écriture | **200** avec du contenu réel |
| une clé qui échoue à sa vérification de chat | jamais écrite dans `keys.txt` (le compte reste réutilisable dans `accounts.json`) |

Créés avec cet outil pendant la construction : **8 comptes / 8 clés, tous `quota 250000`, tous chat-200** sur `deepseek-v4.1-flash`, à travers deux types de tunnel (CONNECT + SOCKS5) et 4 sorties.

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
| boîte mail | broker `POST /create` → emailnator → adresse générée | le panneau ne fait que stocker l'adresse ; le rail ne bloque jamais sur le courrier |
| inscription | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | le code d'invitation est ce qui finance le compte |
| connexion | `POST /api/user/login?turnstile= {username,password}` | `access_token` renvoyé dans le corps |
| compte | `GET /api/user/self` | fournit `id` (→ `New-Api-User`) et le `quota` qui prouve que l'invitation a fonctionné |
| clé | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | la clé en clair est renvoyée une seule fois |
| vérification | `POST /v1/chat/completions` | un 200 en direct est requis avant `keys.txt` |

## ⚙️ Options du CLI

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| Drapeau | Défaut | Signification |
| --- | --- | --- |
| `--count` | 5 | comptes (= clés) à créer |
| `--conc` | 1 | comptes en cours simultanément (plafonné à 16) |
| `--gap` | 1200 | pause en ms entre les tours au sein d'un worker |
| `--model` | `deepseek-v4.1-flash` | modèle utilisé par la barrière en direct |
| `--group` | `deepseek` | groupe de tokens dans lequel la clé est créée (`default` sert la famille gpt) |
| `--aff` | code d'invitation de la flotte | code d'invitation envoyé à l'inscription — c'est la source du quota |
| `--pool <file>` | `proxies.txt` | liste des sorties (env `EASYMAX_PROXIES`) |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | URL(s) de base du broker de boîtes de réception |
| `--inbox <chain>` | `broker,emailnator,local` | ordre du rail de boîtes mail |
| `--tries` | 2 | sorties essayées par compte avant abandon |
| `--verify-only` | — | relance chaque clé de `keys.txt` à travers la barrière de chat |
| `--screen` | — | filtre le pool, écrit les survivants dans `proxies.live.txt` |

## 🛰️ Derrière un proxy

Chaque requête EasyMax sort par **une sortie épinglée par compte** — les appels d'inscription, de connexion, de token et de barrière d'un compte passent tous par la même ligne, et une sortie morte confie le compte à la suivante du pool (`--tries`). Le tunnel est intégré : **`http`/`https` CONNECT (avec authentification proxy `user:pass@`), `socks5` (y compris user/pass) et `socks4a`**. Il n'y a pas de repli direct — avec un pool vide, le rail s'arrête au lieu de contacter le panneau depuis votre propre ligne. Les appels au broker de boîtes de réception sont la seule exception : ils vont vers `localhost`, où votre propre broker gère sa propre sortie.

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | une clé chat-200 par ligne — ignoré par git |
| `keys-ungated.txt` | clés ayant échoué à la re-vérification — à réessayer plus tard |
| `accounts.json` | nom d'utilisateur / mot de passe / e-mail / quota / clé / résultat de la barrière par compte |
| `proxies.txt` | vos sorties, une par ligne — ignoré par git |
| `proxies.live.txt` | survivants de `--screen` |

## 🔌 Connexion à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé compatible OpenAI. Une seule commande transforme `keys.txt` en un nœud fournisseur avec des combos fonctionnels :

```bash
node src/connect-9router.js

# or: npm run 9router
```

Valeurs par défaut : `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Les modèles sont alors servis sous `easymax/<model id>` et répartis en charge sur chaque clé.

## 🔑 Ce qu'une clé vous donne

| | |
| --- | --- |
| 🏢 Fournisseur | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 Ce que le fournisseur donne | un compte par clé — l'inscription par code d'invitation le finance, chaque clé est vérifiée par chat |
| 🔑 Ce qu'une clé vous donne | une clé API limitée à son propre compte : les 5 identifiants de modèles sur le point de terminaison ci-dessous, dans les limites de votre forfait. Le quota vit sur le **compte**, ce qui explique précisément pourquoi cet outil crée un compte par clé |
| 🌐 Forme de l'API | compatible OpenAI : `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Vos données | seuls easymax.ai et le backend de boîtes mail que vous configurez sont contactés ; les clés restent sur votre machine |

## 🐞 Problèmes

Si le panneau modifie la forme de son inscription, supprime le bonus d'invitation ou change les clés de ses groupes, l'outil s'arrête à cette étape et le signale. **[Ouvrez un ticket](../../issues)** avec la commande que vous avez exécutée et la sortie exacte ; les PR sont bienvenues.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>