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
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-5-of-them) · [🧪 API'yi kullanın](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

EasyMax, **düz kullanıcı adı + parola + e-posta ile kayıt** sunan (Turnstile devre dışı, e-posta doğrulaması yok) bir New API panelidir ve karşılama kotası bir **davet kodundan** gelir: davet kodu olmayan bir kayıt `quota: 0` ile sonuçlanır ve anahtarı `403 用户额度不足` yanıtı verir; aynı kayıt bir `aff_code` ile yapıldığında ise **hesap başına 250000 kota (≈ $0.50)** kazandırır — 2026-10-19 tarihinde ölçüldü ve bu aracın var olma sebebi tam da budur. Ölçeklenen birim *anahtar başına bir hesaptır*; araç bunu, **her satırı canlı bir sohbet çağrısından geçmiş** bir `keys.txt` dosyasına dönüştürür; hesap başına bir sabitlenmiş proxy çıkışı ve kendi gelen kutusu hattınızdan bir posta kutusu kullanılır.

## 🎁 Ücretsiz katman — ne kadar elde edersiniz

**Her hesap, kayıt sırasında gönderdiğiniz davet koduyla fonlanır** — ücretsiz katmanın tamamı budur.

| Ne | Değer |
| --- | --- |
| Karşılama kotası | Hesap başına **250000** (≈ $0.50), anahtarın grubunda token başına harcanır |
| Nereden gelir | `POST /api/user/register?turnstile=` ile `aff_code=<code>` |
| Davet kodu olmadan | `quota: 0` → anahtar, ücretli her modelde `403 用户额度不足` yanıtı verir |
| Kart gerekli mi | **Hayır** |
| Captcha | **yok** — kayıt ve girişte Turnstile devre dışı (`?turnstile=` boş bir değer kabul eder) |
| E-posta doğrulaması | **gerekli değil** — panel adresi saklar ve hiçbir zaman kod göndermez |
| Ölçeklenen birim | **bir hesap = bir anahtar** → `--count N` aslında "N fonlanmış hesap" demektir |

`--aff` varsayılan olarak filonun kendi davet kodunu kullanır; kendi kodunuzu gösterirseniz oluşturduğunuz her hesap size panelin komisyonunu kazandırır (bu panel için %10).

> 💡 Ücretsiz katman EasyMax tarafından belirlenir ve değişebilir. Güncel rakamları [easymax.ai](https://easymax.ai) adresinden kontrol edin — ve kararı aracın kendi kapısına bırakın:

```bash
node src/cli.js --verify-only     # keys.txt içindeki her anahtar gerçek bir sohbet çağrısıyla yeniden test edilir
```

## 🤖 Modeller — beşinin tamamı

Panelin kataloğu gruplara ayrılmış **101 model kimliği** (`GET /api/pricing`) içerir; **oluşturduğunuz token grubu, bir anahtarın neyi sunabileceğini belirler**. Aşağıda işaretli kimlikler, yeni oluşturulmuş bir hesapta gerçek bir sohbet çağrısından geçirildi:

| Model Kimliği | Token grubu | ✓ |
| --- | --- | --- |
| `deepseek-v4.1-flash` | `deepseek` (varsayılan) | ✓ |
| `deepseek-v4-pro` | `deepseek` | ✓ |
| `gpt-6-luna` | `default` | ✓ |
| `gpt-5.6-luna` | `default` | ✓ |
| `gpt-6.1-sol` | `default` | ✓ |

`GET /v1/models` tam olarak grubun listesini döndürür: bir `deepseek` grubu anahtarı için **2 kimlik**, bir `default` grubu anahtarı için **14 kimlik** (`gpt-5.5`, `gpt-5.5-openai-compact`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-5.3-codex-spark`, `codex-auto-review`, `gpt-image-2`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`). Araç varsayılan olarak `--group deepseek` oluşturur çünkü bu kimlikler token başına en ucuz olanlardır, dolayısıyla 250000 kotalı bir hesap bunlarda en uzun süre dayanır; bunun yerine o aile için bir anahtar oluşturmak üzere `--group default` (veya panelin sunduğu başka herhangi bir grup adını) geçin.

## 🧪 API nasıl kullanılır

Temel URL **`https://easymax.ai/v1`** — OpenAI uyumlu, yani OpenAI konuşan her şey çalışır (SDK'lar, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://easymax.ai/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

`deepseek-v4-pro` kimliği bir akıl yürütme modelidir: önce `reasoning_content` ile yanıt verir ve `content` yalnızca düşünme bütçesinden sonra gelir; bu yüzden `max_tokens` değerini 100'ün çok üzerinde verin, aksi halde boş bir `content` görürsünüz.

## 🛠 Hızlı başlangıç

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

Bir anahtar `keys.txt` dosyasına **yalnızca** canlı bir sohbet tamamlama çağrısı onu kanıtladıktan sonra eklenir; bu noktaya hiç ulaşamayan bir hesap `accounts.json` içine kaydedilir ve bir sonraki çalıştırmada yeniden denenir.

### 🖱️ Başlatıcı

Başlatıcı proxy listesini, sayıyı ve doğrulama modelini sorar, bunları `launcher.config.json` içinde hatırlar ve CLI'yi doğru bayraklarla çalıştırır.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

| Kontrol | Sonuç |
| --- | --- |
| kayıt `POST /api/user/register?turnstile=` | **200** `{"success":true}` — `aff_code` ile hesap `quota: 250000` değerine ulaşır |
| giriş `POST /api/user/login?turnstile=` | **200** — New-API **v2** yükü (`access_token` JWT + oturum) |
| kimlik doğrulama | `/api/token/*` üzerinde `Authorization: Bearer <access_token>` + `New-Api-User: <uid>` |
| anahtar | `POST /api/token/ {group}` → **200**, ardından `POST /api/token/<id>/key` → tam anahtar |
| sohbet kapısı — yazılmadan önce **her** anahtar için çalıştırılır | Gerçek içerikle **200** |
| sohbet kontrolünde başarısız olan bir anahtar | `keys.txt` dosyasına asla yazılmaz (hesap `accounts.json` içinde yeniden kullanılabilir kalır) |

Geliştirme sırasında bu araçla oluşturuldu: **8 hesap / 8 anahtar, hepsi `quota 250000`, hepsi `deepseek-v4.1-flash` üzerinde sohbet-200**, iki tünel türü (CONNECT + SOCKS5) ve 4 çıkış üzerinden.

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
| posta kutusu | broker `POST /create` → emailnator → oluşturulan adres | panel yalnızca adresi saklar; araç hiçbir zaman postada beklemez |
| kayıt | `POST /api/user/register?turnstile= {username,password,email,aff_code}` | hesabı fonlayan şey davet kodudur |
| giriş | `POST /api/user/login?turnstile= {username,password}` | `access_token` gövdede geri döner |
| hesap | `GET /api/user/self` | `id` (→ `New-Api-User`) ve davetin işe yaradığını kanıtlayan `quota` değerini verir |
| anahtar | `POST /api/token/ {name,group,…}` → `POST /api/token/<id>/key` | düz metin anahtar bir kez geri döner |
| kontrol | `POST /v1/chat/completions` | `keys.txt` öncesinde canlı 200 gerekir |

## ⚙️ CLI seçenekleri

```bash
node src/cli.js --count N [--conc N] [--model <id>] [--group <name>] [--pool <file>]
node src/cli.js --verify-only     # re-check every key in keys.txt
node src/cli.js --screen          # test the proxy list against EasyMax
```

| Bayrak | Varsayılan | Anlamı |
| --- | --- | --- |
| `--count` | 5 | oluşturulacak hesap (= anahtar) sayısı |
| `--conc` | 1 | aynı anda işlenen hesap sayısı (en fazla 16) |
| `--gap` | 1200 | bir çalışan içindeki turlar arası bekleme (ms) |
| `--model` | `deepseek-v4.1-flash` | canlı kapının kullandığı model |
| `--group` | `deepseek` | anahtarın oluşturulduğu token grubu (`default` gpt ailesini sunar) |
| `--aff` | filo davet kodu | kayıt sırasında gönderilen davet kodu — kota kaynağı budur |
| `--pool <file>` | `proxies.txt` | çıkış listesi (ortam değişkeni `EASYMAX_PROXIES`) |
| `--broker <urls>` | `http://127.0.0.1:9700,http://127.0.0.1:9701` | gelen kutusu broker temel URL'si/URL'leri |
| `--inbox <chain>` | `broker,emailnator,local` | posta kutusu hattı sırası |
| `--tries` | 2 | bir hesap vazgeçilmeden önce denenen çıkış sayısı |
| `--verify-only` | — | `keys.txt` içindeki her anahtarı sohbet kapısından yeniden geçir |
| `--screen` | — | havuzu tara, hayatta kalanları `proxies.live.txt` dosyasına yaz |

## 🛰️ Proxy arkasında

Her EasyMax isteği **hesap başına bir sabitlenmiş çıkıştan** geçer — bir hesabın kayıt, giriş, token ve kapı çağrılarının tümü aynı hattı kullanır ve ölü bir çıkış hesabı havuzdaki bir sonrakine devreder (`--tries`). Tünel yerleşiktir: **`http`/`https` CONNECT (`user:pass@` proxy kimlik doğrulamasıyla), `socks5` (kullanıcı/parola dahil) ve `socks4a`**. Doğrudan yedek yoktur — boş bir havuzla araç, paneli kendi hattınızdan aramak yerine çıkış yapar. Gelen kutusu broker çağrıları tek istisnadır: `localhost` adresine giderler, burada kendi broker'ınız kendi çıkışını yönetir.

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `keys.txt` | satır başına bir sohbet-200 anahtarı — git tarafından yok sayılır |
| `keys-ungated.txt` | yeniden kontrolde başarısız olan anahtarlar — daha sonra tekrar deneyin |
| `accounts.json` | hesap başına kullanıcı adı / parola / e-posta / kota / anahtar / kapı sonucu |
| `proxies.txt` | çıkışlarınız, satır başına bir tane — git tarafından yok sayılır |
| `proxies.live.txt` | `--screen` sonucunda hayatta kalanlar |

## 🔌 9Router'a bağlanın

[9Router](https://9router.com) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir. Tek bir komut `keys.txt` dosyasını çalışan kombinasyonlara sahip bir sağlayıcı düğümüne dönüştürür:

```bash
node src/connect-9router.js
# or: npm run 9router
```

Varsayılanlar: `--base http://localhost:20128`, `--password 123456`, `--name "EasyMax"`, `--prefix easymax`, `--base-url https://easymax.ai/v1`. Modeller daha sonra `easymax/<model id>` olarak sunulur ve tüm anahtarlar arasında yük dengelenir.

## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **EasyMax** — [easymax.ai](https://easymax.ai) |
| 🎁 Sağlayıcının verdikleri | anahtar başına bir hesap — davet kodlu kayıt hesabı fonlar, her anahtar sohbet ile doğrulanır |
| 🔑 Bir anahtar size ne kazandırır | kendi hesabına kapsanmış bir API anahtarı: aşağıdaki uç noktada 5 model kimliği, planınızın limitlerinde. Kota **hesapta** yaşar, bu aracın anahtar başına bir hesap oluşturmasının nedeni tam da budur |
| 🌐 API biçimi | OpenAI uyumlu: `POST https://easymax.ai/v1/chat/completions` |
| 🔒 Verileriniz | yalnızca easymax.ai ve yapılandırdığınız gelen kutusu arka ucuyla iletişim kurulur; anahtarlar makinenizde kalır |

## 🐞 Sorunlar

Panel kayıt biçimini değiştirirse, davet bonusunu kaldırırsa veya gruplarını yeniden anahtarlarsa, araç o adımda durur ve bunu bildirir. Çalıştırdığınız komut ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**; PR'lar memnuniyetle karşılanır.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 easymax-bulk-apikey katkıda bulunanlar

</div>