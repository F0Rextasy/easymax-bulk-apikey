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

**Otomatik oluşturulan API anahtarlarıyla toplu EasyMax hesabı oluşturun — OpenAI uyumlu çıkarım (DeepSeek V4.1, DeepSeek V4 Pro, GPT-6 ailesi) + 9Router bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-5%20served-412991?style=for-the-badge)](https://easymax.ai/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-5-of-them) · [🧪 API'yi kullanın](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

EasyMax, **düz kullanıcı adı + parola + e-posta ile kayıt** (e-posta doğrulaması yok) sunan bir New API panelidir ve karşılama kotası bir **davet kodundan** gelir: davet kodu olmadan yapılan kayıt `quota: 0` ile sonuçlanır ve anahtarı `403 用户额度不足` yanıtı verir; oysa **canlı** bir hesabın `aff_code`'unu taşıyan bir kayıt **hesap başına 250000 kota (≈ $0.50)** kazandırır — 2026-10-24 tarihinde yeniden ölçülmüştür. Bu kod bu depoya asla gömülmez: araç önce bir tohum hesap kaydeder ve kod üretmeden önce kodu panelden geri okur (`GET /api/user/aff`), çünkü gönderilen bir kod sahibiyle birlikte ölür (burada eskiden bulunan filo kodu zaten `quota: 0` ödüyor). Cloudflare Turnstile **açık** — `src/solver.js` aynı çıkış üzerinden ekran dışı bir Chrome'da gerçek bir token üretir, bu yüzden `npm install` (puppeteer-core) ve makinede bir Chrome gerekir. Ölçeklenen birim *anahtar başına bir hesap*tır; araç bunu, **her satırı canlı bir sohbet çağrısından geçmiş** bir `keys.txt`'ye dönüştürür, hesap başına bir sabitlenmiş proxy çıkışı, posta kutusu kendi gelen kutunuzdan.

## 🎁 Ücretsiz katman — ne kadar alıyorsunuz

**Her hesap, kaydolduğu davet koduyla finanse edilir — ve araç bu kodu panelin kendisinden alır** — ücretsiz katmanın tamamı budur.

| Ne | Değer |
| --- | --- |
| Karşılama kotası | Hesap başına **250000** (≈ $0.50), anahtarın grubunda token başına harcanır |
| Nereden gelir | `POST /api/user/register?turnstile=` ile `aff_code=<code>`, burada `<code>` **canlı bir hesabın kendi kodudur** (`GET /api/user/aff`) |
| Davet kodu olmadan | `quota: 0` → anahtar ücretli her modelde `403 用户额度不足` yanıtı verir |
| Kart gerekli mi | **Hayır** |
| Captcha | **Cloudflare Turnstile, açık** — aynı çıkış üzerinden ekran dışı bir Chrome'da üretilen gerçek bir token (`src/solver.js`; `npm install` + makinede bir Chrome) |
| E-posta doğrulaması | **gerekli değil** — panel adresi saklar ve asla kod göndermez |
| Ölçeklenen birim | **bir hesap = bir anahtar** → `--count N` aslında "N finanse edilmiş hesap" demektir |

`--code <code>` davet kodunu sabitler (kendi hesabınızın kodu, bu aynı zamanda size panelin komisyonunu da kazandırır — burada %10) ve tohum hesabı atlar; boş bırakırsanız araç önce bir tohum hesap kaydeder ve kodunu toplar, böylece çalışmanın her hesabı **canlı** bir kodla finanse edilir.

> 💡 Ücretsiz katman EasyMax tarafından belirlenir ve değişebilir. Güncel sayıları [easymax.ai](https://easymax.ai) adresinden kontrol edin — ve kararı aracın kendi kapısına bırakın:

```bash
node src/cli.js --verify-only     # keys.txt içindeki her anahtar gerçek bir sohbet çağrısıyla yeniden test edilir
```

## 🤖 Modeller — 5'inin tamamı

Panelin kataloğu gruplara ayrılmış **101 model kimliği** (`GET /api/pricing`) içerir; **ürettiğiniz token grubu bir anahtarın neyi sunabileceğini belirler**. Aşağıda işaretlenen kimlikler yeni üretilmiş bir hesapta gerçek bir sohbet çağrısından geçirilmiştir:

| Model Kimliği | Token grubu | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (varsayılan) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` tam olarak grubun listesini yanıtlar: `deepseek` grubundaki bir anahtar için **2 kimlik**, `default` grubundaki bir anahtar için **14 kimlik** (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). Araç varsayılan olarak `--group deepseek` üretir çünkü bu kimlikler token başına en ucuz olanlardır, böylece 250000 kotası olan bir hesap bunlarda en uzun süre dayanır; bunun yerine o aile için bir anahtar üretmek üzere `--group default` (veya panelin sunduğu başka bir grup adını) geçin.

## 🧪 API nasıl kullanılır

Temel URL **`https://easymax.ai/v1`** — OpenAI uyumlu, yani OpenAI konuşan her şey çalışır (SDK'lar, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

`deepseek-v4-pro` kimliği bir akıl yürütme modelidir: önce `reasoning_content` ile yanıtlar ve `content` yalnızca düşünme bütçesinden sonra gelir, bu yüzden ona 100'ün çok üzerinde `max_tokens` verin yoksa boş bir `content` görürsünüz.

## 🚀 Tek komut

```bash
node src/cli.js --count 10
```

Aracın tamamı budur: anahtar başına bir EasyMax hesabı (panelin geri verdiği davet koduyla finanse edilir), API anahtarı üretilir ve **yalnızca** canlı bir `chat-200` sonrasında saklanır. Captcha adımı da otomatiktir — panel Cloudflare Turnstile çalıştırır ve `src/solver.js` (`--auto` arkasında varsayılan olarak açık) **aynı çıkış üzerinden** ekran dışı bir Chrome'da gerçek bir token üretir, çünkü token çözen IP'ye bağlıdır; tek seferlik `npm install` tam da bunun içindir. Deponun yanındaki bir `proxies.txt` otomatik olarak alınır (hesap başına bir sabitlenmiş çıkış); o olmadan çalışma doğrudan gider.

`--dry` çözümlenen planı yazdırır — sayı, havuz boyutu, çözücü kullanılabilirliği, modeller — ve tek bir dosyaya dokunmadan veya istek yapmadan çıkar:

```bash
node src/cli.js --dry
```

Bayraklar yerine menü mü tercih edersiniz? `npm start` (veya `node src/launcher.js`) → **1) Mint keys** → *How many keys? [10]*.

> ⚠️ **Koşullar ve hesap riski.** Bu araç, üçüncü taraf bir panele karşı hesap oluşturmayı ve API anahtarı vermeyi otomatikleştirir. Bu, panelin Hizmet Koşullarını ihlal edebilir ve hesapların, anahtarların veya IP'lerin yasaklanmasına yol açabilir. **Otomasyon sizin sorumluluğunuzdadır**: sağlayıcının koşullarını okuyun, kendi gelen kutunuzu ve proxy'lerinizi kullanın ve çalıştırmadan önce yaşadığınız yerde bunu yapmanıza izin verildiğinden emin olun.

## 🛠 Hızlı başlangıç

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

Bir anahtar `keys.txt`'ye **yalnızca** canlı bir sohbet tamamlaması onu kanıtladıktan sonra eklenir; o noktaya hiç ulaşamayan bir hesap `accounts.json`'a kaydedilir ve bir sonraki çalışmada yeniden denenir.

### 🖱️ Başlatıcı

`npm start` (veya `node src/launcher.js`) aynı CLI'nin menü biçimidir: **1) Mint keys** → *How many keys? [10]* (Enter 10'u kabul eder) `node src/cli.js --auto --count N` çalıştırır. Asla bir captcha, token veya proxy sormaz — `proxies.txt` mevcut olduğunda otomatik olarak kullanılır. Bir özet tablosuyla biter (canlı/toplam, gecikme, hata sınıfları) ve `keys.txt` yolunu verir; kapıdan geçemeyen anahtarlar `keys-dead.txt`'ye düşer.

## ✅ Doğrulandı — her anahtar test edilir

| Kontrol | Sonuç |
| --- | --- |
| kayıt `POST /api/user/register?turnstile=` | **200** `{"success":true}` — canlı bir `aff_code` ile hesap `quota: 250000` ile sonuçlanır |
| kaydın Turnstile'ı | gerçek bir token gerekir (o olmadan `Turnstile 校验失败`) ve tam da onu harcayan çıkıştan üretilir |
| giriş `POST /api/user/login?turnstile=` | **200** — New-API **v2** yükü (`access_token` JWT + oturum) |
| kimlik doğrulama | `/api/token/*` üzerinde `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` |
| anahtar | `POST /api/token/ {group}` → **200**, ardından `POST /api/token/<id>/key` → tam anahtar |
| sohbet kapısı — yazılmadan önce **her** anahtar için çalıştırılır | gerçek içerikle **200** |
| sohbet kontrolünde başarısız olan bir anahtar | asla `keys.txt`'ye yazılmaz (hesap `accounts.json`'da yeniden kullanılabilir kalır) |

Derleme sırasında bu araçla üretildi: **8 hesap / her anahtar, hepsi `quota 250000`, hepsi `deepseek-v4.1-flash` üzerinde chat-200**, iki tünel türü (CONNECT + SOCKS5) ve 4 çıkış üzerinden. 2026-10-24 tarihinde bu deponun kendi CLI'siyle yeniden ölçüldü (`--count 1`, bir WARP çıkışı): tohum hesabın kendi kodu üretilen hesabı `quota 250000` ile finanse etti ve anahtarı iki farklı istemde chat-200 yanıtı verdi.

> **Kalite kapıları.** Buradaki her anahtar `keys.txt`'ye yazılmadan önce canlı bir `chat-200`'den geçti
> (ölü anahtarlar asla gönderilmez). Yönlendirici kombinasyonları model düzeyinde aynı kuralı izler: bir giriş
> **yalnızca model `chat-200` yanıtlıyorsa ve araçları çağırabiliyorsa** eklenir — araç desteği olmayan bir model,
> ölü bir anahtar veya ölü bir sağlayıcı eklenmek yerine çıkarılır. Doğrulama adımını istediğiniz zaman yeniden çalıştırın;
> başarısızlıklar bildirilir, asla gizlenmez.

## 🧭 Nasıl çalışır

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: EasyMax page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://easymax.ai/v1/chat/completions → real content = the key is live
```

| Adım | Çağrı | Notlar |
| --- | --- | --- |
| captcha | `src/solver.js` — ekran dışı Chrome, hesabın çıkışına sabitlenmiş | Turnstile açıktır ve tokenını onu harcayan IP'ye bağlar |
| davet kodu | bir tohum hesap → `GET /api/user/aff` | panelin kendi yanıtı, çalışmanın her hesabının kaydolduğu koddur (bunun yerine `--code` bir kod sabitler) |
| posta kutusu | broker `POST /create` → emailnator → oluşturulan adres | panel yalnızca adresi saklar; araç asla postada takılmaz |
| kayıt | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | hesabı finanse eden şey davet kodudur |
| giriş | `POST /api/user/login?turnstile= {username,password}` | `access_token` gövdede geri döner |
| hesap | `GET /api/user/self` | `id` (→ `New-Api-User`) ve davetin işe yaradığını kanıtlayan `quota` değerini verir |
| anahtar | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | düz metin anahtar bir kez geri döner |
| kontrol | `POST /v1/chat/completions` | `keys.txt`'den önce canlı 200 gerekir |

## ⚙️ CLI seçenekleri

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --dry             # print the resolved plan, touch nothing
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| Bayrak | Varsayılan | Anlamı |
| --- | --- | --- |
| `--count` | 5 | üretilecek hesap (= anahtar) sayısı |
| `--auto` | açık | gömülü captcha çözücüsünü kullan (`--no-auto` devre dışı bırakır; captcha adımı otomatiktir — bkz. `src/solver.js`) |
| `--dry` | — | çözümlenen planı yazdır ve çık (hesap yok, dosya yok, ağ yok) |
| `--conc` | 1 | aynı anda işlenen hesap sayısı (16 ile sınırlı) |
| `--gap` | 1200 | bir işçi içindeki turlar arası bekleme (ms) |
| `--model` | `deepseek-v4.1-flash` | canlı kapının kullandığı model |
| `--group` | `deepseek` | anahtarın oluşturulduğu token grubu (`default` gpt ailesini sunar) |
| `--code <code>` | canlı bir tohum hesaptan okunur | kayıtta gönderilen davet kodu — kota kaynağı budur |
| `--pool <file>` | `proxies.txt` | çıkış listesi (ortam değişkeni `EASYMAX_PROXIES`) — isteğe bağlı: havuz olmadan CLI doğrudan bağlanır |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | gelen kutusu broker temel URL(ler)i |
| `--inbox <chain>` | `broker,emailnator,local` | posta kutusu hattı sırası |
| `--exits` | 6 | bir hesap vazgeçilmeden önce denenen çıkış sayısı |
| `--verify-only` | — | `keys.txt` içindeki her anahtarı sohbet kapısından yeniden geçir |
| `--screen` | — | havuzu tara, hayatta kalanları `proxies.live.txt`'ye yaz |

## 🛰️ Proxy arkasında

Bir çıkış listesi sağlandığında her EasyMax isteği bu listeden geçer — **hesap başına bir sabitlenmiş çıkış**: bir hesabın kayıt, giriş, token ve kapı çağrılarının tümü aynı hattı kullanır ve ölü bir çıkış hesabı havuzdaki bir sonrakine devreder (`--exits`). Tünel yerleşiktir: **`http`/`https` CONNECT (`user:pass@` proxy kimlik doğrulamasıyla), `socks5` (kullanıcı/parola dahil) ve `socks4a`**.

**İsteğe bağlı — ölçekte önerilir (IP başına sınırlar, yasaklar).** Araç proxy olmadan da çalışır.

- **Havuzla:** `--pool <file>` geçin (veya `EASYMAX_PROXIES` ayarlayın) — yukarıdaki gibi hesap başına bir sabitlenmiş çıkış.
- **Havuzsuz:** CLI `running WITHOUT a proxy (direct)` yazdırır ve doğrudan bağlanır; kayıt, anahtar üretimi ve sohbet kapısı değişmez — yalnızca paketler kendi hattınızdan çıkar.
- Gelen kutusu broker çağrıları her iki modda da `localhost`'a gider; burada kendi broker'ınız kendi çıkışını yapar.

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `keys.txt` | satır başına bir chat-200 anahtarı — git tarafından yok sayılır |
| `keys-ungated.txt` | yeniden kontrolden geçemeyen anahtarlar — daha sonra yeniden deneyin |
| `keys-dead.txt` | üretilen ancak sohbet kapısından hiç geçemeyen anahtarlar — yeniden deneme malzemesi |
| `src/solver.js` | `--auto` arkasındaki captcha modülü — hesabın çıkışı üzerinden ekran dışı bir Chrome'da üretilen gerçek bir Turnstile tokenı |
| `accounts.json` | hesap başına kullanıcı adı / parola / e-posta / kota / anahtar / kapı sonucu |
| `proxies.txt` | çıkışlarınız, satır başına bir tane — git tarafından yok sayılır |
| `proxies.live.txt` | `--screen`'den hayatta kalanlar |

## 🔌 9Router'a bağlan

[9Router](https://9router.com) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir. Tek komut `keys.txt`'yi çalışan kombinasyonlara sahip bir sağlayıcı düğümüne dönüştürür:

```bash
node src/connect-9router.js
# or: npm run 9router
```

Varsayılanlar: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Modeller daha sonra `easymax/<model id>` olarak sunulur ve her anahtar arasında yük dengelenir.

## 🔌 OmniRoute'a bağlan

[OmniRoute](https://omniroute.online) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir. Tek komut `keys.txt`'yi çalışan kombinasyonlara sahip bir sağlayıcı düğümüne dönüştürür:

```bash
node src/connect-omniroute.js
# or: npm run omniroute
```

Varsayılanlar: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Modeller daha sonra `easymax/<model id>` olarak sunulur ve her anahtar arasında yük dengelenir.

## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 Sağlayıcının verdikleri | anahtar başına bir hesap — davet kodlu kayıt onu finanse eder, her anahtar sohbet doğrulamalı |
| 🔑 Bir anahtar size ne kazandırır | kendi hesabına kapsanmış bir API anahtarı: aşağıdaki uç noktadaki 5 model kimliği, planınızın sınırlarında. Kota **hesapta** yaşar, bu aracın neden anahtar başına bir hesap oluşturduğunun tam nedeni budur |
| 🌐 API biçimi | OpenAI uyumlu: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Verileriniz | yalnızca easymax.ai ve yapılandırdığınız gelen kutusu arka ucuna bağlanılır; anahtarlar makinenizde kalır |

## 🐞 Sorunlar

Panel kayıt biçimini değiştirirse, davet bonusunu kaldırırsa veya gruplarını yeniden anahtarlarsa, araç o adımda durur ve bunu bildirir. Çalıştırdığınız komut ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**; PR'lar memnuniyetle karşılanır.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey katkıda bulunanlar

</div>