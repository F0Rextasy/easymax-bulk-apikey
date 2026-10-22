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

**Массовое создание аккаунтов EasyMax с автоматически сгенерированными API-ключами — вывод, совместимый с OpenAI (DeepSeek V4.1, DeepSeek V4 Pro, семейство GPT-6) + коннектор 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://easymax.ai/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный уровень](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-5-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

EasyMax — это панель New API с **обычной регистрацией по имени пользователя + паролю + e-mail** (Turnstile отключён, подтверждение e-mail отсутствует), а её приветственная квота зависит от **кода приглашения**: чистая регистрация приводит к `quota: 0`, и её ключ отвечает `403 用户额度不足`, тогда как та же регистрация с `aff_code` даёт **250000 квоты (≈ $0.50) на аккаунт** — измерено 2026-10-19, и именно поэтому этот инструмент вообще существует. Единица масштабирования — *один аккаунт на ключ*; инструмент превращает это в `keys.txt`, где **каждая строка прошла живой вызов чата**, по одному закреплённому выходному прокси на аккаунт, а почтовый ящик берётся из вашей собственной почтовой инфраструктуры.

## 🎁 Бесплатный уровень — сколько вы получаете

**Каждый аккаунт пополняется кодом приглашения, который вы отправляете при регистрации** — это и есть весь бесплатный уровень.

| Что | Значение |
| --- | --- |
| Приветственная квота | **250000** (≈ $0.50) на аккаунт, расходуется по токенам в группе ключа |
| Откуда берётся | `POST /api/user/register?turnstile=` с `aff_code=<code>` |
| Без кода приглашения | `quota: 0` → ключ отвечает `403 用户额度不足` на каждой платной модели |
| Требуется карта | **Нет** |
| Капча | **нет** — Turnstile отключён при регистрации и входе (`?turnstile=` принимает пустое значение) |
| Подтверждение e-mail | **не требуется** — панель сохраняет адрес и никогда не отправляет код |
| Единица масштабирования | **один аккаунт = один ключ** → `--count N` на самом деле означает «N пополненных аккаунтов» |

`--aff` по умолчанию использует собственный код приглашения флота; укажите свой, и каждый созданный вами аккаунт начислит вам комиссию панели (10 % для этой панели).

> 💡 Бесплатный уровень устанавливается EasyMax и может измениться. Проверяйте актуальные цифры на [easymax.ai](https://easymax.ai) — и пусть собственный контроль инструмента решит:

```bash
node src/cli.js --verify-only     # каждый ключ в keys.txt перепроверяется реальным вызовом чата
```

## 🤖 Модели — все 5

Каталог панели содержит **101 идентификатор модели** (`GET /api/pricing`), разделённых по группам; **группа токена, которую вы создаёте, определяет, что может обслуживать ключ**. Идентификаторы, отмеченные ниже, были проверены реальным вызовом чата на только что созданном аккаунте:

| ID модели | Группа токена | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (по умолчанию) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` возвращает ровно список группы: **2 идентификатора** для ключа группы `deepseek`, **14 идентификаторов** для ключа группы `default` (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). Инструмент по умолчанию создаёт `--group deepseek`, потому что эти идентификаторы самые дешёвые по токенам, так что аккаунт с квотой 250000 держится на них дольше всего; передайте `--group default` (или любое другое имя группы, которое предоставляет панель), чтобы создать ключ для этого семейства.

## 🧪 Как использовать API

Базовый URL — **`https://easymax.ai/v1`** — совместим с OpenAI, поэтому работает всё, что говорит на OpenAI (SDK, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

Идентификатор `deepseek-v4-pro` — это модель рассуждений: она отвечает сначала `reasoning_content`, а `content` только после бюджета размышления, поэтому задавайте `max_tokens` значительно выше 100, иначе увидите пустой `content`.

## 🛠 Быстрый старт

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

Ключ добавляется в `keys.txt` **только** после того, как живое завершение чата подтвердит его; аккаунт, который так и не дошёл до этого момента, записывается в `accounts.json` и повторяется при следующем запуске.

### 🖱️ Лаунчер

Лаунчер запрашивает список прокси, количество и модель проверки, запоминает их в `launcher.config.json` и запускает CLI с нужными флагами.

## ✅ Проверено в работе — каждый ключ протестирован

| Проверка | Результат |
| --- | --- |
| регистрация `POST /api/user/register?turnstile=` | **200** `{"success":true}` — с `aff_code` аккаунт получает `quota: 250000` |
| вход `POST /api/user/login?turnstile=` | **200** — полезная нагрузка New-API **v2** (`access_token` JWT + сессия) |
| авторизация | `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` на `/api/token/*` |
| ключ | `POST /api/token/ {group}` → **200**, затем `POST /api/token/<id>/key` → полный ключ |
| контроль чата — выполняется для **каждого** ключа перед записью | **200** с реальным содержимым |
| ключ, не прошедший проверку чата | никогда не записывается в `keys.txt` (аккаунт остаётся пригодным для повторного использования в `accounts.json`) |

Создано этим инструментом во время сборки: **8 аккаунтов / 8 ключей, все `quota 250000`, все chat-200** на `deepseek-v4.1-flash`, через два типа туннелей (CONNECT + SOCKS5) и 4 выходных узла.

## 🧭 Как это работает

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| Шаг | Вызов | Примечания |
| --- | --- | --- |
| почтовый ящик | брокер `POST /create` → emailnator → сгенерированный адрес | панель только сохраняет адрес; инструмент никогда не блокируется на почте |
| регистрация | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | именно код приглашения пополняет аккаунт |
| вход | `POST /api/user/login?turnstile= {username,password}` | `access_token` возвращается в теле ответа |
| аккаунт | `GET /api/user/self` | даёт `id` (→ `New-Api-User`) и `quota`, подтверждающую, что приглашение сработало |
| ключ | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | открытый ключ возвращается один раз |
| проверка | `POST /v1/chat/completions` | требуется живой 200 перед записью в `keys.txt` |

## ⚙️ Опции CLI

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| Флаг | По умолчанию | Значение |
| --- | --- | --- |
| `--count` | 5 | аккаунтов (= ключей) для создания |
| `--conc` | 1 | одновременно обрабатываемых аккаунтов (не более 16) |
| `--gap` | 1200 | пауза в мс между раундами внутри воркера |
| `--model` | `deepseek-v4.1-flash` | модель, используемая живым контролем |
| `--group` | `deepseek` | группа токена, в которой создаётся ключ (`default` обслуживает семейство gpt) |
| `--aff` | код приглашения флота | код приглашения, отправляемый при регистрации — это источник квоты |
| `--pool <file>` | `proxies.txt` | список выходных узлов (переменная окружения `EASYMAX_PROXIES`) |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | базовый URL(ы) брокера почтовых ящиков |
| `--inbox <chain>` | `broker,emailnator,local` | порядок почтовых сервисов |
| `--tries` | 2 | выходных узлов, испытываемых на аккаунт перед отказом |
| `--verify-only` | — | повторно прогнать каждый ключ в `keys.txt` через контроль чата |
| `--screen` | — | проверить пул, записать выжившие в `proxies.live.txt` |

## 🛰️ За прокси

Каждый запрос к EasyMax уходит через **один закреплённый выходной узел на аккаунт** — вызовы регистрации, входа, токена и контроля для аккаунта идут по одной и той же линии, а мёртвый узел передаёт аккаунт следующему в пуле (`--tries`). Туннель встроен: **`http`/`https` CONNECT (с аутентификацией прокси `user:pass@`), `socks5` (включая user/pass) и `socks4a`**. Прямого запасного варианта нет — при пустом пуле инструмент завершается, а не обращается к панели с вашей собственной линии. Вызовы брокера почтовых ящиков — единственное исключение: они идут на `localhost`, где ваш собственный брокер выполняет свой исходящий трафик.

## 📄 Файлы

| Путь | Содержимое |
| --- | --- |
| `keys.txt` | один ключ с chat-200 на строку — игнорируется git |
| `keys-ungated.txt` | ключи, не прошедшие повторную проверку — повторите позже |
| `accounts.json` | имя пользователя / пароль / e-mail / квота / ключ / результат контроля на аккаунт |
| `proxies.txt` | ваши выходные узлы, по одному на строку — игнорируется git |
| `proxies.live.txt` | выжившие после `--screen` |

## 🔌 Подключение к 9Router

[9Router](https://9router.com) — это самостоятельно размещаемый маршрутизатор, совместимый с OpenAI. Одна команда превращает `keys.txt` в узел-провайдер с рабочими комбинациями:

```bash
node src/connect-9router.js

# or: npm run 9router
```

Значения по умолчанию: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Затем модели обслуживаются как `easymax/<model id>` и балансируются между всеми ключами.

## 🔑 Что даёт один ключ

| | |
| --- | --- |
| 🏢 Провайдер | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 Что даёт провайдер | один аккаунт на ключ — регистрация по коду приглашения пополняет его, каждый ключ проверен чатом |
| 🔑 Что даёт один ключ | один API-ключ, привязанный к своему аккаунту: 5 идентификаторов моделей на указанной ниже конечной точке, в пределах лимитов вашего плана. Квота хранится на **аккаунте**, и именно поэтому этот инструмент создаёт один аккаунт на ключ |
| 🌐 Форма API | Совместим с OpenAI: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Ваши данные | связь только с easymax.ai и настроенным вами почтовым бэкендом; ключи остаются на вашей машине |

## 🐞 Проблемы

Если панель изменит форму регистрации, отменит бонус за приглашение или переименует группы, инструмент остановится на этом шаге и сообщит об этом. **[Откройте issue](../../issues)** с командой, которую вы запустили, и точным выводом; PR приветствуются.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey contributors

</div>