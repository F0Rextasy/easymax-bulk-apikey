#!/usr/bin/env node
'use strict';
/**
 * solver.js — the captcha solver that ships inside every bulk-apikey repo.
 *
 * One file, one entry point. The CLI calls it with the account's own exit so the
 * token and the request that spends it leave from the same IP (several panels
 * bind the token to the solving exit and answer `Turnstile token is empty` /
 * `校验失败` otherwise).
 *
 *   const { solveCaptcha } = require('./solver');
 *   const { token, ms } = await solveCaptcha({ type: 'turnstile', sitekey, url, proxy });
 *
 * Types
 *   turnstile        Cloudflare Turnstile — a real Chrome window, offscreen.
 *   hcaptcha         hCaptcha — same Chrome window, the sitekey is mounted in the
 *                    page and the token read back from getResponse().
 *   recaptcha2-image reCAPTCHA v2/v3 — plain HTTP (anchor → reload → image round).
 *   tencent          Tencent TCaptcha (turing.captcha.qcloud.com) — plain HTTP.
 *   image            A PNG challenge handed in by the caller, read by a VLM.
 *
 * Returns `{ token, ms }`; `token` is exactly what the panel expects, never
 * trimmed (panels compare the whole blob). Failures throw an Error carrying
 * `.code` (`no-chrome`, `no-token`, `timeout`, `vlm-unconfigured`,
 * `tencent-tdc-required`, …) so the CLI can class the failure instead of
 * retrying forever.
 *
 * Browser engine: `puppeteer-core` + the Chrome already on the machine
 * (`--chrome-path` / `CHROME_PATH` / the usual install paths / `channel:'chrome'`).
 * No bundled Chromium — a repo stays ~1 MB instead of ~500 MB.
 *
 * Chrome is launched **headed but offscreen** (`--window-position=-32000,-32000`):
 * measured on this fleet, headless solves 0/16 while the offscreen window solves
 * 16/16 (Cloudflare reads the real window/GPU surface).
 *
 * `Runtime.enable` is never sent: that one CDP call is what Turnstile's "CDP
 * detected" check keys on. Puppeteer sends it from its own frame manager, so the
 * CDP session prototypes are patched below to drop it — which also means
 * `page.evaluate()` can never resolve an execution context, and every read/write
 * in this file goes through `Runtime.evaluate` on a private CDP session instead.
 *
 * ToS: automating a captcha is the operator's responsibility; this file ships no
 * proxy, key or account and only solves what the caller points it at.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const tls = require('tls');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const DEFAULT_TIMEOUT_MS = 90 * 1000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (code, message) => Object.assign(new Error(message), { code });

// --------------------------------------------------------------- puppeteer
let _puppeteer = null;
/** puppeteer-core is a declared dependency; cwd is the fallback for a repo whose
 *  node_modules lives one level up from the script (measured: `require` inside a
 *  subdirectory misses the repo root). */
function puppeteer() {
  if (_puppeteer) return _puppeteer;
  try {
    _puppeteer = require('puppeteer-core');
  } catch (e) {
    try {
      _puppeteer = require(path.join(process.cwd(), 'node_modules', 'puppeteer-core'));
    } catch (e2) {
      throw fail('no-puppeteer', 'missing dependency "puppeteer-core" — run: npm i puppeteer-core');
    }
  }
  return _puppeteer;
}

/** Drop `Runtime.enable` and `Runtime.disable` (Turnstile's CDP tell). Done once,
 *  on the CDP session prototypes, before Chrome is launched: the frame manager
 *  fires `Runtime.enable` while attaching, long before any caller can hook it. */
let _patched = false;
function suppressRuntimeDomain() {
  if (_patched) return;
  _patched = true;
  for (const p of ['puppeteer-core/lib/puppeteer/api/CDPSession.js', 'puppeteer-core/lib/puppeteer/cdp/CdpSession.js']) {
    let mod;
    try { mod = require(p); } catch (e) { continue; }
    for (const name of Object.keys(mod)) {
      const proto = mod[name] && mod[name].prototype;
      if (!proto || typeof proto.send !== 'function') continue;
      const orig = proto.send;
      proto.send = function (method, ...rest) {
        if (method === 'Runtime.enable' || method === 'Runtime.disable') return Promise.resolve({});
        return orig.call(this, method, ...rest);
      };
    }
  }
}

/** The Chrome on this machine, or a clear error naming the one-line install. */
function findChrome(explicit) {
  // An explicit path that is not there must fail loudly: silently falling back to
  // an installed Chrome hides a typo and makes the "no Chrome here" case untestable.
  if (explicit && !fs.existsSync(explicit)) throw fail('no-chrome', `no Chrome found at ${explicit} — check chromePath / CHROME_PATH`);
  const cands = [];
  if (process.env.CHROME_PATH) cands.push(process.env.CHROME_PATH);
  if (process.platform === 'win32') {
    cands.push(
      path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    );
  } else if (process.platform === 'darwin') {
    cands.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    cands.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium');
  }
  for (const c of cands) if (c && fs.existsSync(c)) return { executablePath: c };
  // let puppeteer resolve an installed Chrome itself (its error feeds launchHint)
  return { channel: 'chrome' };
}

/** Chrome exited before the first page came up → name the real cause. */
function launchHint(err) {
  const m = String((err && err.message) || err);
  if (/Could not find (Chrome|browser)|channel.*not found|ENOENT/i.test(m)) {
    return fail('no-chrome', `no Chrome found — install Google Chrome, or pass chromePath/CHROME_PATH (${m.slice(0, 120)})`);
  }
  return fail('launch-failed', m.slice(0, 300));
}

/** Windows still holds handles on the profile for a moment after Chrome exits,
 *  so a single rmSync races it; retry, then say so instead of leaking silently. */
async function rmProfile(dir, log = () => {}) {
  for (let i = 0; i < 4; i++) {
    try { fs.rmSync(dir, { recursive: true, force: true }); return true; } catch (e) {
      if (i === 3) { log(`profile left behind: ${dir} (${e.message})`); return false; }
    }
    await sleep(400);
  }
  return false;
}

/** `http://user:pass@host:port` → the flag-safe server plus the credentials Chrome
 *  refuses to take inside it (`net::ERR_NO_SUPPORTED_PROXIES`). */
function proxyParts(proxy) {
  if (!proxy) return null;
  try {
    const u = new URL(String(proxy));
    return { server: `${u.protocol}//${u.host}`, username: decodeURIComponent(u.username || ''), password: decodeURIComponent(u.password || '') };
  } catch (e) {
    return { server: String(proxy), username: '', password: '' };
  }
}

/** A credentialed exit's 407 is answered on our own CDP session: Chrome sends no
 *  userinfo from `--proxy-server`, so the Fetch domain carries it instead. */
async function authenticateProxy(cdp, creds, log) {
  cdp.on('Fetch.authRequired', (p) => cdp.send('Fetch.continueWithAuth', {
    requestId: p.requestId,
    authChallengeResponse: { response: 'ProvideCredentials', username: creds.username, password: creds.password },
  }).catch(() => {}));
  cdp.on('Fetch.requestPaused', (p) => cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {}));
  await cdp.send('Fetch.enable', { handleAuthRequests: true });
  log('proxy auth via Fetch.handleAuthRequests');
}

// ------------------------------------------------------------ chrome session
/**
 * Launches a throwaway offscreen Chrome with a fresh profile and hands the
 * callback a private CDP session on its first page. Everything is released
 * afterwards, profile included (`keepProfile` only for debugging).
 */
async function withChrome({ proxy = '', chromePath = '', timeoutMs = DEFAULT_TIMEOUT_MS, keepProfile = false, log = () => {} }, fn) {
  const puppeteerCore = puppeteer();
  suppressRuntimeDomain();
  const dir = keepProfile ? '' : fs.mkdtempSync(path.join(os.tmpdir(), 'solver-'));
  const opts = Object.assign(
    {
      headless: false,
      viewport: null,
      userDataDir: dir || undefined,
      protocolTimeout: timeoutMs + 30000,
      // `--enable-automation` is what sets navigator.webdriver = true, and Turnstile
      // simply refuses to render while that flag is up (measured: widget absent for
      // 25 s on two panels; the same page renders and issues a token the moment the
      // flag is dropped). `AutomationControlled` is the matching blink feature.
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--window-position=-32000,-32000',
        '--window-size=1280,900',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
      ],
    },
    findChrome(chromePath),
  );
  const px = proxyParts(proxy);
  if (px) opts.args.push(`--proxy-server=${px.server}`);

  let browser = null;
  let cdp = null;
  const timer = setTimeout(() => { try { cdp && cdp.close(); } catch (e) {} try { browser && browser.close(); } catch (e) {} }, timeoutMs + 20000);
  try {
    try {
      browser = await puppeteerCore.launch(opts);
    } catch (e) {
      throw launchHint(e);
    }
    const page = await browser.newPage();
    cdp = await page.createCDPSession();
    if (px && px.username) await authenticateProxy(cdp, px, log);
    log(`chrome ${opts.executablePath || 'channel:chrome'}${px ? ` via ${px.server}` : ''}`);
    return await fn({ page, cdp, browser, log });
  } finally {
    clearTimeout(timer);
    try { if (cdp) await cdp.close(); } catch (e) {}
    try { if (browser) await browser.close(); } catch (e) { log(`close err ${e.message}`); }
    if (dir) await rmProfile(dir, log)
  }
}

/** Evaluate in the page's main world. `Runtime.evaluate` needs no
 *  `Runtime.enable`, so this is the one read/write path the solver uses. */
async function evalIn(cdp, expression, timeoutMs = 20000) {
  const r = await Promise.race([
    cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }),
    sleep(timeoutMs).then(() => { throw fail('timeout', `Runtime.evaluate timed out (${timeoutMs}ms)`); }),
  ]);
  if (r && r.exceptionDetails) throw fail('eval-failed', String((r.exceptionDetails.exception || {}).description || 'page threw').slice(0, 200));
  return r && r.result ? r.result.value : undefined;
}
const evalJson = async (cdp, expr) => { try { return JSON.parse(await evalIn(cdp, expr)); } catch (e) { return null; } };

/** Stepped, jittered click — a straight `mouse.move` + `click` is the second
 *  thing a bot check looks at. Dispatched on our own session (Input domain). */
async function humanClick(cdp, x, y, log = () => {}) {
  const sx = x - 60 - Math.floor(Math.random() * 120);
  const sy = y + 20 + Math.floor(Math.random() * 60);
  const steps = 14 + Math.floor(Math.random() * 12);
  for (let i = 1; i <= steps; i++) {
    const u = i / steps;
    const ease = u * u * (3 - 2 * u);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sx + (x - sx) * ease, y: sy + (y - sy) * ease, buttons: 0 });
    await sleep(6 + Math.random() * 14);
  }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
  await sleep(50 + Math.random() * 100);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
  await sleep(40 + Math.random() * 70);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 });
  log(`clicked ${x},${y}`);
}

// --------------------------------------------------------------- turnstile
// Current Turnstile releases render the widget inside a *closed* shadow root: a
// plain DOM walk (even one that recurses open shadow roots) sees no iframe. Two
// fallbacks cover it — the hidden `cf-turnstile-response` input the widget
// injects (widget is live) and the CDP DOM domain with `pierce:true`, which
// flattens shadow content and can hand back the iframe's box. Reading the token
// is always the widget's own value; nothing is injected.
const MOUNT = `(() => {
  const hosts = [], frames = [];
  const walk = (root) => {
    let els = [];
    try { els = [...root.querySelectorAll('iframe')]; } catch (e) {}
    for (const el of els) {
      let b; try { b = el.getBoundingClientRect(); } catch (e) { continue; }
      if (b.width >= 20 && b.height >= 10) frames.push({ src: String(el.src || '').slice(0, 120), x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) });
    }
    for (const el of els.concat([...root.querySelectorAll('*')])) if (el.shadowRoot) walk(el.shadowRoot);
  };
  walk(document);
  for (const el of document.querySelectorAll('[data-sitekey], .cf-turnstile, #cf-turnstile')) {
    let b; try { b = el.getBoundingClientRect(); } catch (e) { continue; }
    hosts.push({ sitekey: el.getAttribute('data-sitekey'), x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) });
  }
  const cf = frames.find((f) => /challenges\\.cloudflare\\.com/.test(f.src));
  return JSON.stringify({
    host: hosts[0] || null, frame: cf || frames[0] || null, frames: frames.length,
    input: !!document.querySelector('input[name="cf-turnstile-response"], textarea[name="cf-turnstile-response"]'),
  });
})()`;

const TOKEN = `(() => {
  const vals = [...document.querySelectorAll('input[name="cf-turnstile-response"], textarea[name="cf-turnstile-response"]')]
    .map((i) => i.value).filter((v) => v && v.length > 10);
  let g = '';
  try { if (typeof turnstile !== 'undefined' && turnstile.getResponse) g = turnstile.getResponse() || ''; } catch (e) {}
  return vals.concat(g ? [g] : []).sort((a, b) => b.length - a.length)[0] || '';
})()`;

/** Any element's box, even from inside a closed shadow root — the CDP DOM domain
 *  with `pierce:true` flattens shadow content, so the widget iframe is visible
 *  where the page's own `querySelectorAll` is not. */
async function piercedBox(cdp, selector) {
  try {
    const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    if (!nodeId) return null;
    const { model } = await cdp.send('DOM.getBoxModel', { nodeId });
    const b = model.border;
    const xs = [b[0], b[2], b[4], b[6]];
    const ys = [b[1], b[3], b[5], b[7]];
    const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
    return w >= 20 && h >= 10 ? { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), via: 'dom-pierce' } : null;
  } catch (e) { return null; }
}

async function solveTurnstile({ sitekey = '', url, proxy = '', chromePath = '', timeoutMs = DEFAULT_TIMEOUT_MS, log = () => {} }) {
  if (!url) throw fail('bad-args', 'turnstile needs { url } (the page the widget lives on)');
  const t0 = Date.now();
  const left = () => timeoutMs - (Date.now() - t0);
  return withChrome({ proxy, chromePath, timeoutMs, log }, async ({ page, cdp }) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Math.min(45000, Math.max(10000, left())) });
    let mount = null;
    let rect = null;
    // mount window: a SPA can mount the widget several seconds after DOMContentLoaded
    while (left() > timeoutMs - 25000) {
      mount = await evalJson(cdp, MOUNT);
      rect = (mount && mount.host && mount.host.w >= 20 && mount.host.h >= 10 ? mount.host : null) || (mount && mount.frame) || (await piercedBox(cdp, 'iframe[src*="challenges.cloudflare.com"]'));
      if (rect || (mount && mount.input)) break;
      await sleep(1000);
    }
    if (!rect && !(mount && mount.input)) {
      throw Object.assign(fail('no-token', `no Turnstile widget on ${url} (sitekey ${sitekey || '?'})`), { mount });
    }
    let tok = String((await evalIn(cdp, TOKEN)) || '');
    for (let round = 0; rect && round < 3 && !tok && left() > 8000; round++) {
      const until = Date.now() + Math.min(round === 0 ? 8000 : 20000, left());
      while (!tok && Date.now() < until) { await sleep(600); tok = String((await evalIn(cdp, TOKEN)) || ''); }
      if (tok) break;
      await humanClick(cdp, rect.x + 30, rect.y + Math.round(rect.h / 2), log);
      await sleep(1500 + Math.random() * 2000);
      tok = String((await evalIn(cdp, TOKEN)) || '');
    }
    while (!tok && left() > 2500) { await sleep(600); tok = String((await evalIn(cdp, TOKEN)) || ''); }
    if (tok.length <= 20) {
      throw Object.assign(fail('no-token', `Turnstile issued no token in ${Date.now() - t0}ms (mount=${JSON.stringify(mount)})`), { mount });
    }
    log(`turnstile ${tok.length} chars${rect ? ` (click point ${rect.x},${rect.y})` : ''}`);
    // never trim: panels compare the whole blob, and a trimmed token is refused
    return { token: tok, ms: Date.now() - t0, mount };
  });
}

// ---------------------------------------------------------------- hcaptcha
// hCaptcha is solved through *our own* widget mount on the panel's page: the
// site's key is rendered into a fixed host element and the token is read back
// from `hcaptcha.getResponse()` / the `h-captcha-response` field. The reference
// rail for this fleet (`proxy-lab/captcha-solve.js --mount auto`) measures the
// same shape: a plain-HTTP hCaptcha request is refused by the server, the Chrome
// mount is not. An invisible widget starts a challenge on its own; a visible one
// gets the checkbox clicked (and hCaptcha's ~10 s post-click risk check waited
// out), which is why this rail's budget is longer than Turnstile's.
const HC_API = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=ompHcOnload';

const HC_MOUNT = `(async () => {
  const waitApi = async (ms) => {
    const until = Date.now() + ms;
    while (typeof hcaptcha === 'undefined' && Date.now() < until) await new Promise((r) => setTimeout(r, 250));
    return typeof hcaptcha !== 'undefined';
  };
  window.__ompHC = window.__ompHC || null;
  if (typeof hcaptcha === 'undefined' && !document.getElementById('omp-captcha-api')) {
    const s = document.createElement('script');
    s.id = 'omp-captcha-api';
    s.src = ${JSON.stringify(HC_API)};
    document.head.appendChild(s);
  }
  if (!(await waitApi(15000)) || !hcaptcha.render) return JSON.stringify({ ok: false, why: 'api-missing' });
  try {
    const old = document.getElementById('omp-mount-host');
    if (old) old.remove();
    const host = document.createElement('div');
    host.id = 'omp-mount-host';
    host.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;padding:4px';
    document.body.appendChild(host);
    if (window.__ompHCId != null) { try { hcaptcha.remove(window.__ompHCId); } catch (e) {} }
    window.__ompHCId = hcaptcha.render(host, {
      sitekey: SITEKEY_HERE,
      // "invisible" is the shape the site itself uses (opencode's console loads
      // api.js?render=explicit and calls execute() on submit): a visible widget
      // invites a challenge, an invisible one passes on its own when the exit is
      // clean — measured 3/3 (1828/1831/1827-char tokens, ~8 s) on that page.
      size: 'invisible',
      callback: (tk) => { window.__ompHC = tk; },
    });
    return JSON.stringify({ ok: true, widgetId: String(window.__ompHCId) });
  } catch (e) { return JSON.stringify({ ok: false, why: String((e && e.message) || e) }); }
})()`;

// Whatever is filled wins: the callback value, getResponse(), or the hidden field.
// A bare widget can stay tokenless while a *solved* challenge fills the field.
const HC_TOKEN = `(() => {
  const vals = [...document.querySelectorAll('[name="h-captcha-response"], textarea[name="h-captcha-response"]')]
    .map((i) => i.value).filter((v) => v && v.length > 20);
  let g = '';
  try {
    if (typeof hcaptcha !== 'undefined' && hcaptcha.getResponse) g = hcaptcha.getResponse(window.__ompHCId != null ? window.__ompHCId : undefined) || '';
  } catch (e) {}
  return [window.__ompHC, g, ...vals].filter((v) => v && String(v).length > 20).sort((a, b) => String(b).length - String(a).length)[0] || '';
})()`;

/**
 * Run the widget. OUR mounted widget is executed first — measured on opencode's
 * register page, `execute(ourWidgetId)` alone hands back a token in ~8 s, while
 * executing the page's half-rendered `[data-hcaptcha-widget-id]` produced nothing
 * and left the rail waiting. The page's own widget is executed afterwards only
 * when it is a *different* id (its callback belongs to the site, so its token
 * would land in the site's own field, which the caller reads anyway).
 */
const HC_TRIGGER = `(() => {
  if (typeof hcaptcha === 'undefined' || !hcaptcha.execute) return JSON.stringify({ ok: false, why: 'no-execute' });
  // async:true hands the token back as a promise — the shape the site itself uses.
  // Either path lands in window.__ompHC, which is what the rail reads.
  const exec = (id) => {
    try {
      const p = id == null ? hcaptcha.execute({ async: true }) : hcaptcha.execute(id, { async: true });
      if (p && typeof p.then === 'function') p.then((tk) => { if (tk) window.__ompHC = tk; }).catch(() => {});
      return 'ok';
    } catch (e) { return String((e && e.message) || e); }
  };
  const mine = MOUNT_ID_HERE;
  const el = document.querySelector('[data-hcaptcha-widget-id]');
  const pageId = el ? el.getAttribute('data-hcaptcha-widget-id') : null;
  const out = { mine: mine != null ? exec(mine) : 'none' };
  if (pageId != null && String(pageId) !== String(mine)) out.page = exec(pageId);
  out.ok = out.mine === 'ok' || out.page === 'ok';
  return JSON.stringify(out);
})()`;

/** Progress probe for the wait loop: which token source is filled, how many
 *  hCaptcha frames exist, and whether one of them is challenge-sized. */
const HC_STATE = `(() => {
  let resp = '';
  try { if (typeof hcaptcha !== 'undefined' && hcaptcha.getResponse) resp = String(hcaptcha.getResponse(window.__ompHCId != null ? window.__ompHCId : undefined) || ''); } catch (e) {}
  const field = document.querySelector('[name="h-captcha-response"]');
  const frames = [...document.querySelectorAll('iframe')].filter((f) => /hcaptcha/.test(String(f.src || '')));
  const big = frames.filter((f) => { const r = f.getBoundingClientRect(); return r.width >= 200 && r.height >= 200; }).length;
  return JSON.stringify({ cb: String(window.__ompHC || '').length, resp: resp.length, field: field ? String(field.value || '').length : -1, frames: frames.length, big });
})()`;

/** The site's own key, when the caller did not pass one: `data-hcaptcha-sitekey`,
 *  the iframe's `sitekey=` query parameter, or an inline `hcaptcha.render` call. */
const HC_SITEKEY = `(() => {
  const attr = document.querySelector('[data-hcaptcha-sitekey], .h-captcha[data-sitekey], [data-sitekey]');
  const a = attr ? (attr.getAttribute('data-hcaptcha-sitekey') || attr.getAttribute('data-sitekey')) : null;
  const f = [...document.querySelectorAll('iframe[src*="hcaptcha.com"]')].map((x) => String(x.src)).join(' ');
  const m = /[?&#]sitekey=([0-9a-f-]{20,})/i.exec(f);
  const r = /sitekey\\s*:\\s*['"]([0-9a-f-]{20,})['"]/i.exec(document.documentElement.innerHTML);
  return (a && /[0-9a-f-]{20,}/i.test(a) ? a : null) || (m ? m[1] : null) || (r ? r[1] : null) || '';
})()`;

// ------------------------------------------------- hcaptcha visual challenge
// A widget that "passes invisibly" needs none of this; when hCaptcha decides the
// exit looks automated it presents an image grid inside its own cross-origin
// frame. That frame is an OOPIF, so the page's DOM cannot read it and
// `page.evaluate` cannot reach it either (`Runtime.enable` is off) — the tiles are
// read through a CDP session attached to the *frame target*, and the answer comes
// from the caller's vision model (the same `SOLVER_VLM_*` endpoint the HTTP rails
// use). Clicks are dispatched in page coordinates: the frame's own rect plus the
// element's rect inside the frame (both viewport-relative CSS pixels).
const HC_TILE_SELECTORS = [
  '.task-image',
  '.image-grid .task, .task-grid .task',
  '.challenge-container .image-grid > div',
  '.image-grid div[class*="task"]',
  '.task-grid div',
  '.image-grid div[class*="image"]',
];
const HC_CHALLENGE = `(() => {
  const rect = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  let tiles = [];
  for (const s of ${JSON.stringify(HC_TILE_SELECTORS)}) {
    const els = [...document.querySelectorAll(s)].filter((e) => { const r = e.getBoundingClientRect(); return r.width >= 20 && r.height >= 20; });
    if (els.length >= 4) { tiles = els; break; }
  }
  const promptEl = document.querySelector('.prompt-text, .challenge-prompt, [class*="prompt"]');
  // Never the centre footer link (it points at hcaptcha.com): only positive
  // submit labels are candidates.
  const btns = [...document.querySelectorAll('button, [role="button"], input[type="submit"], .button-submit')]
    .map((b) => Object.assign({ text: String(b.innerText || b.value || '').replace(/\\s+/g, ' ').trim() }, rect(b)))
    .filter((b) => b.w >= 20 && b.h >= 10 && /verify|next|kontrol|sonraki|submit|check|doğrula/i.test(b.text));
  return JSON.stringify({
    instruction: promptEl ? String(promptEl.innerText || '').replace(/\\s+/g, ' ').trim() : '',
    tiles: tiles.map((t) => Object.assign(rect(t), { checked: /checked|selected/.test(String(t.className)) })),
    verify: btns[0] || null,
    canvas: !!document.querySelector('canvas'),
  });
})()`;

/** The challenge frame target, if hCaptcha has one up. */
async function hcFrameSession(browser) {
  for (const t of browser.targets()) {
    if (!/hcaptcha\.com/.test(t.url()) || !/(frame=challenge|frame=draw)/.test(t.url())) continue;
    try { return { session: await t.createCDPSession(), url: t.url() }; } catch (e) { /* target raced away */ }
  }
  return null;
}

/** Screen PNG of the page region the frame occupies. */
async function clipShot(cdp, box) {
  const r = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 },
  });
  return Buffer.from(r.data, 'base64');
}

const HC_GRID_PROMPT = `This is an hCaptcha image challenge. The task shown to the user: "\${instruction}".
The grid is \${rows} rows x \${cols} columns, \${total} tiles, indexed row-major starting at 0.
Answer with a JSON array of the 0-based indices of EVERY tile that matches, e.g. [0,3,7]. Nothing else.`;

/**
 * Solve up to `rounds` image rounds in the already-open page. Returns the token
 * as soon as the widget emits one, else ''. A rejected round is *not* retried in
 * place: hCaptcha keeps a strike counter per challenge, so the caller's retry has
 * to come with a fresh exit + a fresh challenge (the CLI's `--auto` loop).
 */
async function hcSolveChallenge({ browser, page, cdp, box, opts, log, left }) {
  let tok = '';
  for (let round = 1; round <= 3 && !tok && left() > 15000; round++) {
    const frame = await hcFrameSession(browser);
    if (!frame) {
      log(`hcaptcha challenge: no frame session (targets: ${browser.targets().filter((t) => /hcaptcha/.test(t.url())).map((t) => `${t.type()}:${String(t.url()).slice(-40)}`).join(' | ') || 'none'})`);
      break;
    }
    const d = await evalJson(frame.session, HC_CHALLENGE);
    if (!d) { log('hcaptcha challenge: frame closed or unreadable'); break; }
    if (d.canvas && !d.tiles.length) {
      const done = await hcCanvasRound(frame.session, { cdp, box, opts, log });
      if (!done) { log('hcaptcha challenge: canvas round could not be read'); break; }
      const until0 = Date.now() + Math.min(25000, left() - 2000);
      while (!tok && Date.now() < until0) { await sleep(600); tok = String((await evalIn(cdp, HC_TOKEN)) || ''); }
      const freshBox = await evalJson(cdp, HC_FRAME_BOX);
      if (freshBox && freshBox.w >= 200) box = freshBox;
      continue;
    }
    if (!d.tiles.length) { log('hcaptcha challenge: no tiles'); break; }
    const n = d.tiles.length;
    const side = Math.round(Math.sqrt(n));
    const rows = side * side === n ? side : n > 9 ? 4 : 3;
    const cols = Math.ceil(n / rows);
    let picks = [];
    try {
      const shot = await clipShot(cdp, box);
      const answer = await askVlm(vlmConfig(opts), {
        b64: shot.toString('base64'),
        proxy: opts.vlmProxy || '',
        instruction: HC_GRID_PROMPT.replace('${instruction}', d.instruction || '(none)').replace('${rows}', String(rows)).replace('${cols}', String(cols)).replace('${total}', String(n)),
      });
      picks = JSON.parse((/\[[\s\S]*\]/.exec(answer) || ['[]'])[0]).filter((i) => Number.isInteger(i) && i >= 0 && i < n);
    } catch (e) {
      log(`hcaptcha challenge round ${round}: vision model refused (${e.code || 'error'}: ${String(e.message).slice(0, 90)})`);
      break;
    }
    log(`hcaptcha challenge round ${round}: "${String(d.instruction).slice(0, 60)}" ${n} tiles (${rows}x${cols}) → picks ${JSON.stringify(picks)}`);
    if (!picks.length) break;
    for (const i of picks) {
      const t = d.tiles[i];
      await humanClick(cdp, box.x + t.x + Math.round(t.w / 2), box.y + t.y + Math.round(t.h / 2), log);
      await sleep(250 + Math.random() * 250);
    }
    if (d.verify) {
      await sleep(400);
      await humanClick(cdp, box.x + d.verify.x + Math.round(d.verify.w / 2), box.y + d.verify.y + Math.round(d.verify.h / 2), log);
    }
    const until = Date.now() + Math.min(20000, left() - 2000);
    while (!tok && Date.now() < until) { await sleep(600); tok = String((await evalIn(cdp, HC_TOKEN)) || ''); }
    // the challenge may resize between rounds: re-read the frame box
    const fresh = await evalJson(cdp, HC_FRAME_BOX);
    if (fresh && fresh.w >= 200) box = fresh;
  }
  return tok;
}

// ---------------------------------------------- hcaptcha canvas challenge
// hCaptcha's non-DOM family ("select the N items that break the pattern", and the
// drag rounds) paints everything into one `<canvas>` inside the challenge frame.
// The canvas is untainted, so the puzzle can be read at native resolution and
// cropped to its opaque bounding box — the reference rail measured that the top
// ~32 % of a 1000x1034 canvas is fully transparent, and a model asked for
// fractions of the *whole* canvas answers inside that dead band (three clicks in
// empty space per round). Fractions of the crop are mapped back through the
// canvas rect and then into the page: frame box + (canvas rect + crop offset) * scale.
const HC_CANVAS = `(async () => {
  const all = [...document.querySelectorAll('canvas')];
  let best = null;
  for (const c of all) {
    let ink = 0, n = 0;
    try {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const step = Math.max(1, Math.floor(Math.min(c.width, c.height) / 70));
      for (let y = 0; y < c.height; y += step) for (let x = 0; x < c.width; x += step) { const k = (y * c.width + x) * 4; if (d[k] + d[k + 1] + d[k + 2] > 60) ink++; n++; }
    } catch (e) { continue; }
    const score = n && ink / n > 0.04 ? c.width * c.height : -1;
    if (score > 0 && (!best || score > best.score)) best = { c, score };
  }
  if (!best) return JSON.stringify({ have: false });
  const c = best.c, ctx = c.getContext('2d'), W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    if (d[(y * W + x) * 4 + 3] > 8) { if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x; }
  }
  if (y1 < 0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
  x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2);
  x1 = Math.min(W - 1, x1 + 2); y1 = Math.min(H - 1, y1 + 2);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const off = document.createElement('canvas');
  off.width = cw; off.height = ch;
  off.getContext('2d').putImageData(ctx.getImageData(x0, y0, cw, ch), 0, 0);
  const r = c.getBoundingClientRect();
  const p = document.querySelector('.prompt-text, .challenge-prompt, [class*="prompt"]');
  const rectOf = (e) => { const q = e.getBoundingClientRect(); return { x: Math.round(q.x), y: Math.round(q.y), w: Math.round(q.width), h: Math.round(q.height) }; };
  const btns = [...document.querySelectorAll('button, [role="button"], .button-submit, input[type="submit"]')]
    .map((b) => Object.assign({ text: String(b.innerText || b.value || '').replace(/\\s+/g, ' ').trim() }, rectOf(b)))
    .filter((b) => b.w >= 20 && b.h >= 10 && /verify|next|kontrol|sonraki|submit|check|doğrula|ileri/i.test(b.text));
  return JSON.stringify({
    have: true, crop: off.toDataURL('image/png'), x0, y0, cw, ch, native: [W, H],
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    prompt: p ? String(p.innerText || '').replace(/\\s+/g, ' ').trim() : '',
    verify: btns[0] || null,
  });
})()`;

const HC_CANVAS_PROMPT = `This image is an hCaptcha canvas challenge, cropped to the puzzle (no empty border). The task shown to the user: "\${prompt}".
Answer with JSON only: {"points":[[x,y],...]} for every item that matches, as fractions 0..1 of THIS image (origin top-left). For a drag task answer {"from":[x,y],"to":[x,y]} instead. Nothing else.`;

/** One canvas round inside the frame session. True when input was dispatched. */
async function hcCanvasRound(frameSession, { cdp, box, opts, log }) {
  let cap = null;
  for (let i = 0; i < 8 && !cap; i++) {
    const raw = await evalJson(frameSession, HC_CANVAS);
    if (raw && raw.have && String(raw.crop).length > 2000) { cap = raw; break; }
    await sleep(600);
  }
  if (!cap) return false;
  const scale = cap.rect.w / cap.native[0];
  const toPage = (px, py) => ({
    x: box.x + Math.round(cap.rect.x + (cap.x0 + px * cap.cw) * scale),
    y: box.y + Math.round(cap.rect.y + (cap.y0 + py * cap.ch) * scale),
  });
  let answer = '';
  try {
    answer = await askVlm(vlmConfig(opts), {
      b64: String(cap.crop).split(',')[1] || '',
      proxy: opts.vlmProxy || '',
      instruction: HC_CANVAS_PROMPT.replace('${prompt}', cap.prompt || '(none)'),
    });
  } catch (e) {
    log(`hcaptcha canvas: vision model refused (${e.code || 'error'}: ${String(e.message).slice(0, 90)})`);
    return false;
  }
  let parsed = null;
  try { parsed = JSON.parse((/\{[\s\S]*\}/.exec(answer) || ['{}'])[0]); } catch (e) { parsed = null; }
  if (!parsed) { log(`hcaptcha canvas: unparseable answer ${String(answer).slice(0, 80)}`); return false; }
  log(`hcaptcha canvas ${cap.native[0]}x${cap.native[1]} photo ${cap.cw}x${cap.ch}: "${String(cap.prompt).slice(0, 50)}" → ${JSON.stringify(parsed).slice(0, 140)}`);
  const pts = Array.isArray(parsed.points) ? parsed.points.filter((p) => Array.isArray(p) && p.length === 2 && p.every((v) => Number.isFinite(v))) : [];
  if (pts.length) {
    for (const [fx, fy] of pts) { const p = toPage(fx, fy); await humanClick(cdp, p.x, p.y, log); await sleep(350 + Math.random() * 300); }
  } else if (Array.isArray(parsed.from) && Array.isArray(parsed.to)) {
    const a = toPage(parsed.from[0], parsed.from[1]);
    const b = toPage(parsed.to[0], parsed.to[1]);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: a.x, y: a.y, buttons: 0 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: a.x, y: a.y, button: 'left', clickCount: 1, buttons: 1 });
    for (let i = 1; i <= 14; i++) {
      const u = i / 14;
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(a.x + (b.x - a.x) * u), y: Math.round(a.y + (b.y - a.y) * u), buttons: 1 });
      await sleep(30 + Math.random() * 30);
    }
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1, buttons: 0 });
    log(`hcaptcha canvas drag ${a.x},${a.y} → ${b.x},${b.y}`);
  } else {
    log('hcaptcha canvas: model returned neither points nor a drag');
    return false;
  }
  if (cap.verify) {
    await sleep(450);
    await humanClick(cdp, box.x + cap.verify.x + Math.round(cap.verify.w / 2), box.y + cap.verify.y + Math.round(cap.verify.h / 2), log);
  }
  return true;
}

/**
 * The *challenge* frame's box. hCaptcha keeps several iframes around at once —
 * a mounted widget, a 0×0 loader and frames parked at y=-9999 — so "the first
 * hCaptcha iframe" is the wrong answer (measured: it returned 0×0, then a parked
 * 300x150 frame at y=-9999, and the challenge branch ran against both). Only an
 * on-screen frame large enough to hold a puzzle counts.
 */
const HC_FRAME_BOX = `(() => {
  const frames = [...document.querySelectorAll('iframe')].filter((f) => /hcaptcha/.test(String(f.src || '')));
  let best = null;
  for (const f of frames) {
    const r = f.getBoundingClientRect();
    if (r.width < 200 || r.height < 200) continue;
    if (r.y < 0 || r.x < -50 || r.y >= innerHeight || r.x >= innerWidth) continue;
    if (!best || r.width * r.height > best.w * best.h) best = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  }
  return JSON.stringify(best);
})()`;

async function solveHcaptcha({ sitekey = '', url, proxy = '', chromePath = '', timeoutMs = DEFAULT_TIMEOUT_MS, log = () => {} }, opts = {}) {
  if (!url) throw fail('bad-args', 'hcaptcha needs { url } (the page the widget lives on)');
  const t0 = Date.now();
  const left = () => timeoutMs - (Date.now() - t0);
  return withChrome({ proxy, chromePath, timeoutMs, log }, async ({ page, cdp, browser }) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Math.min(45000, Math.max(10000, left())) });
    // A page that already carries a live token needs no work at all.
    let tok = String((await evalIn(cdp, HC_TOKEN)) || '');
    const key = sitekey || String((await evalIn(cdp, HC_SITEKEY)) || '');
    if (!key && !tok) throw fail('no-token', `no hCaptcha sitekey on ${url} — pass { sitekey }`);
    const mount = await evalJson(cdp, HC_MOUNT.replace('SITEKEY_HERE', JSON.stringify(key)));
    log(`hcaptcha mount sitekey=${key || '?'} → ${JSON.stringify(mount)}`);
    if (!(mount && mount.ok) && !tok) throw Object.assign(fail('no-token', `hCaptcha api did not come up: ${mount ? mount.why : 'no answer'}`), { mount });

    // `execute()` comes FIRST and alone. Measured on opencode's register page
    // (2026-10-23, the same sitekey the fleet needs): a bare mount + execute hands
    // back a 1828-char token in ~8 s with no challenge at all, while the same
    // widget clicked on the checkbox five times never produced a token — the click
    // is what makes hCaptcha put up the image round. A visible widget's checkbox
    // only gets clicked once execute() has failed to deliver anything.
    const waitToken = async (ms) => {
      const until = Date.now() + Math.max(0, Math.min(ms, left() - 1500));
      let tick = 0;
      while (!tok && Date.now() < until) {
        await sleep(600);
        tok = String((await evalIn(cdp, HC_TOKEN)) || '');
        if (!tok && ++tick % 8 === 0) {
          // Cheap, honest progress: which source is empty, and is a challenge up?
          const st = await evalJson(cdp, HC_STATE);
          log(`hcaptcha waiting: cb=${st ? st.cb : '?'} resp=${st ? st.resp : '?'} field=${st ? st.field : '?'} frames=${st ? st.frames : '?'} big=${st ? st.big : '?'}`);
        }
      }
    };
    const trigger = await evalJson(cdp, HC_TRIGGER.replace('MOUNT_ID_HERE', mount && mount.widgetId != null ? JSON.stringify(String(mount.widgetId)) : 'null'));
    log(`hcaptcha trigger ${JSON.stringify(trigger)}`);
    await waitToken(30000);
    let rect = null;
    if (!tok) {
      // A *visible* widget sits in our host element; its checkbox is at ~(30, h/2)
      // of the 300x74 box (the reference rail clicks the same point via the frame).
      for (let i = 0; i < 6 && !rect && !tok; i++) {
        rect = await piercedBox(cdp, '#omp-mount-host iframe[src*="hcaptcha.com"]');
        if (!rect) rect = await evalJson(cdp, `(() => { const h = document.getElementById('omp-mount-host'); if (!h) return 'null'; const r = h.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }); })()`);
        if (rect && !(rect.w >= 20)) rect = null;
        if (!rect) await sleep(500);
      }
      if (rect) {
        await humanClick(cdp, rect.x + 30, rect.y + Math.round(rect.h / 2), log);
        await waitToken(30000); // hCaptcha's risk check runs ~10 s after the click
      }
    }
    // No token from the widget itself: hCaptcha has put up an image round. The
    // challenge frame has grown past the mount widget, so re-read its box.
    if (!tok) {
      const box = (await evalJson(cdp, HC_FRAME_BOX)) || rect;
      log(`hcaptcha challenge check: box=${JSON.stringify(box)} rect=${JSON.stringify(rect)}`);
      if (box && box.w >= 100) {
        log(`hcaptcha challenge frame ${box.w}x${box.h} — solving with the vision model`);
        // A challenge that tears its own frame down (hCaptcha closes it after a
        // refused answer) must land as "no token", never as a raw CDP error.
        tok = await hcSolveChallenge({ browser, page, cdp, box, opts: { ...opts, proxy }, log, left }).catch((e) => {
          log(`hcaptcha challenge aborted: ${String(e.message).slice(0, 100)}`);
          return '';
        });
      }
    }
    if (String(tok).length <= 20) {
      throw Object.assign(fail('no-token', `hCaptcha issued no token in ${Date.now() - t0}ms (mount=${JSON.stringify(mount)}; an image round the vision model could not clear, or an exit hCaptcha scores as automated)`), { mount });
    }
    log(`hcaptcha ${String(tok).length} chars`);
    // never trim: panels compare the whole blob
    return { token: String(tok), ms: Date.now() - t0, mount };
  });
}

// ------------------------------------------------------------- http plumbing
/** One tunnel socket to `host:port` through `proxy` (http/https CONNECT or
 *  socks5). `null` dials straight out. */
function dial(proxy, host, port, timeoutMs = 15000) {
  if (!proxy) {
    return new Promise((resolve, reject) => {
      const s = net.connect({ host, port });
      const t = setTimeout(() => { s.destroy(); reject(new Error(`connect timeout ${host}:${port}`)); }, timeoutMs);
      s.once('connect', () => { clearTimeout(t); resolve(s); });
      s.once('error', (e) => { clearTimeout(t); reject(e); });
    });
  }
  const u = new URL(proxy);
  const kind = u.protocol.replace(':', '');
  if (kind === 'socks5' || kind === 'socks5h') {
    return new Promise((resolve, reject) => {
      const s = net.connect({ host: u.hostname, port: Number(u.port) || 1080 });
      const t = setTimeout(() => { s.destroy(); reject(new Error(`socks5 timeout ${u.hostname}`)); }, timeoutMs);

      let buf = Buffer.alloc(0);
      const done = (e) => { clearTimeout(t); s.removeAllListeners('data'); e ? (s.destroy(), reject(e)) : resolve(s); };
      s.on('error', (e) => done(e));
      s.on('connect', () => s.write(Buffer.from(u.username ? [0x05, 0x02, 0x00, 0x02] : [0x05, 0x01, 0x00])));
      s.on('data', (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        if (stage === 'method') {
          if (buf.length < 2) return;
          const method = buf[1];
          buf = buf.slice(2);
          if (method === 0xff) return done(new Error('socks5: no acceptable auth method'));
          if (method === 0x02) {
            stage = 'auth';
            const a = Buffer.from(u.username || '');
            const b = Buffer.from(u.password || '');
            return s.write(Buffer.concat([Buffer.from([0x01, a.length]), a, Buffer.from([b.length]), b]));
          }
          stage = 'reply';
          const h = Buffer.from(host);
          return s.write(Buffer.concat([Buffer.from([0x05, 0x01, 0x00, 0x03, h.length]), h, Buffer.from([(port >> 8) & 0xff, port & 0xff])]));
        }
        if (stage === 'auth') {
          if (buf.length < 2) return;
          const ok = buf[1] === 0x00;
          buf = buf.slice(2);
          if (!ok) return done(new Error('socks5: auth rejected'));
          stage = 'reply';
          const h = Buffer.from(host);
          return s.write(Buffer.concat([Buffer.from([0x05, 0x01, 0x00, 0x03, h.length]), h, Buffer.from([(port >> 8) & 0xff, port & 0xff])]));
        }
        if (buf.length < 5) return;
        const atyp = buf[3];
        const need = atyp === 0x01 ? 10 : atyp === 0x04 ? 22 : 7 + buf[4];
        if (buf.length < need) return;
        if (buf[1] !== 0x00) return done(new Error(`socks5: connect failed (code ${buf[1]})`));
        const rest = buf.slice(need);
        clearTimeout(t);
        s.removeAllListeners('data');
        if (rest.length) s.unshift(rest);
        resolve(s);
      });
    });
  }
  if (kind !== 'http' && kind !== 'https') throw fail('bad-proxy', `unsupported proxy scheme "${kind}" (use http, https or socks5)`);
  return new Promise((resolve, reject) => {
    const s = net.connect({ host: u.hostname, port: Number(u.port) || 8080 });
    let buf = '';
    const t = setTimeout(() => { s.destroy(); reject(new Error(`proxy timeout ${u.hostname}`)); }, timeoutMs);

    s.once('connect', () => {
      const auth = u.username ? `Proxy-Authorization: Basic ${Buffer.from(`${decodeURIComponent(u.username)}:${decodeURIComponent(u.password || '')}`).toString('base64')}\r\n` : '';
      s.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n${auth}\r\n`);
    });
    const onData = (c) => {
      buf += c.toString('latin1');
      const i = buf.indexOf('\r\n\r\n');
      if (i < 0) return;
      const code = Number((/^HTTP\/1\.[01] (\d{3})/.exec(buf) || [])[1]);
      clearTimeout(t);
      s.removeListener('data', onData);
      const rest = Buffer.from(buf.slice(i + 4), 'latin1');
      if (code !== 200) return (s.destroy(), reject(new Error(`proxy CONNECT refused (${code || 'no status'})`)));
      if (rest.length) s.unshift(rest);
      resolve(s);
    };
    s.on('data', onData);
  });
}

/** HTTP(S) request through `proxy`, body as Buffer. */
function request(proxy, url, { method = 'GET', headers = {}, body = null, binary = false, timeoutMs = 30000 } = {}) {
  const u = new URL(url);
  const secure = u.protocol === 'https:';
  return new Promise((resolve, reject) => {
    const where = `${u.hostname}${proxy ? ` via ${new URL(proxy).host}` : ''}`;
    const t = setTimeout(() => reject(fail('request-failed', `request timeout → ${where} (${url.slice(0, 50)})`)), timeoutMs);
    dial(proxy, u.hostname, Number(u.port) || (secure ? 443 : 80), Math.min(timeoutMs, 15000))
      .then((socket) => {
        const sock = secure ? tls.connect({ socket, servername: u.hostname }) : socket;
        sock.on('error', (e) => { clearTimeout(t); reject(fail('request-failed', `${where}: ${e.message}`)); });
        const fire = () => {
          const req = http.request(
            { createConnection: () => sock, method, path: u.pathname + u.search, headers: Object.assign({ host: u.host }, headers), setHost: false },
            (res) => {
              const chunks = [];
              res.on('data', (c) => chunks.push(c));
              res.on('end', () => {
                clearTimeout(t);
                const buf = Buffer.concat(chunks);
                resolve({ status: res.statusCode, headers: res.headers, buf, text: buf.toString(binary ? 'latin1' : 'utf8') });
              });
            },
          );
          req.on('error', (e) => { clearTimeout(t); reject(fail('request-failed', `${where}: ${e.message}`)); });
          if (body) req.write(body);
          req.end();
        };
        // The handshake event belongs to the *TLS* socket — listening on the raw
        // one never fires, which silently turned every https call into a timeout.
        if (secure) sock.once('secureConnect', fire); else fire();
      })
      .catch((e) => { clearTimeout(t); reject(e.code ? e : fail('request-failed', `${where}: ${e.message}`)); });
  });
}

// --------------------------------------------------------------------- VLM
/** Vision model endpoint, caller-supplied (a repo ships no key): SOLVER_VLM_URL
 *  (OpenAI-compatible base), SOLVER_VLM_KEY, SOLVER_VLM_MODEL. */
function vlmConfig(opts = {}) {
  const base = opts.vlmUrl || process.env.SOLVER_VLM_URL;
  const key = opts.vlmKey || process.env.SOLVER_VLM_KEY;
  const model = opts.vlmModel || process.env.SOLVER_VLM_MODEL;
  if (!base || !key || !model) {
    throw fail('vlm-unconfigured', 'no vision model: set SOLVER_VLM_URL, SOLVER_VLM_KEY, SOLVER_VLM_MODEL (an OpenAI-compatible /chat/completions endpoint)');
  }
  return { base: base.replace(/\/$/, ''), key, model };
}

async function askVlm(cfg, { b64, mime = 'image/png', instruction, maxTokens = 200, proxy = '', timeoutMs = 90000 }) {
  const r = await request(proxy, `${cfg.base}/chat/completions`, {
    method: 'POST',
    timeoutMs,
    headers: { authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: [{ type: 'text', text: instruction }, { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } }] }],
    }),
  });
  if (r.status !== 200) throw fail('vlm-error', `vision model answered HTTP ${r.status}: ${r.text.slice(0, 160)}`);
  let content = '';
  try { content = (((JSON.parse(r.text).choices || [])[0] || {}).message || {}).content || ''; } catch (e) { throw fail('vlm-error', `vision model envelope unreadable: ${r.text.slice(0, 160)}`); }
  if (!content) throw fail('vlm-error', 'vision model returned no content');
  return String(content).trim();
}

// ------------------------------------------------------- image (caller PNG)
async function solveImage({ imageB64, instruction, proxy = '', log = () => {} }, opts = {}) {
  if (!imageB64) throw fail('bad-args', 'image needs { imageB64 } (a base64 PNG/JPEG challenge)');
  const cfg = vlmConfig(opts);
  const b64 = String(imageB64).replace(/^data:[^,]+,/, '');
  const answer = await askVlm(cfg, {
    b64,
    proxy,
    instruction: instruction || 'This is an image captcha. Read the characters/answer it asks for and reply with the answer only, no punctuation, no explanation.',
  });
  log(`image → ${answer.slice(0, 40)}`);
  return { token: answer, ms: 0 };
}

// ------------------------------------------------- recaptcha v2/v3 (HTTP)
const RECAPTCHA_VER = 'NhfdZHzre16wrc2m6BxEdu7J'; // pinned anchor release the fleet captured; override with opts.ver
const xssi = (text) => { try { return JSON.parse(String(text).replace(/^\)\]\}'\s*/, '')); } catch (e) { return null; } };
/** Google's `co`: base64 of `scheme://host:port` — the port is not optional. */
function coOf(origin) {
  const u = new URL(origin);
  return Buffer.from(`${u.protocol}//${u.hostname}:${u.port || (u.protocol === 'https:' ? 443 : 80)}`).toString('base64').replace(/=+$/, '') + '.';
}

async function solveRecaptcha2({ sitekey, url, proxy = '', log = () => {} }, opts = {}) {
  if (!sitekey || !url) throw fail('bad-args', 'recaptcha2-image needs { sitekey, url } (url is the page that hosts the widget)');
  const origin = new URL(url).origin;
  const ver = opts.ver || RECAPTCHA_VER;
  const t0 = Date.now();
  const H = { 'user-agent': UA, referer: origin + '/', 'accept-language': 'en-US,en;q=0.9' };
  const anchor = `https://www.google.com/recaptcha/api2/anchor?ar=1&k=${sitekey}&co=${encodeURIComponent(coOf(origin))}&hl=en&v=${ver}&size=normal&sa=action&anchor-ms=20000&execute-ms=30000&cb=${crypto.randomBytes(8).toString('hex')}`;
  const a = await request(proxy, anchor, { headers: H });
  const tok = /id="recaptcha-token"[^>]*value="([^"]+)"/.exec(a.text);
  if (!tok) throw fail('reactcha-refused', `anchor refused for sitekey ${sitekey} (HTTP ${a.status})`);
  const c = tok[1];
  const reload = await request(proxy, `https://www.google.com/recaptcha/api2/reload?k=${sitekey}`, {
    method: 'POST',
    headers: Object.assign({ 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', origin: 'https://www.google.com' }, H),
    body: `v=${ver}&reason=r&c=${encodeURIComponent(c)}&k=${sitekey}&hl=en&size=normal&sa=action&anchor-ms=20000&execute-ms=30000`,
  });
  const j = xssi(reload.text);
  if (!j) throw fail('recaptcha-error', `reload unreadable: ${reload.text.slice(0, 160)}`);
  // Google hands the token straight out whenever it does not want an image round
  if (Array.isArray(j) && j[0] === 'rresp' && typeof j[1] === 'string') return { token: j[1], ms: Date.now() - t0 };

  const spec = Array.isArray(j) ? j[1] : j;
  const p = spec && (spec.p || spec.pd || spec.payload);
  if (!p) throw fail('captcha-error', `challenge without a payload id: ${JSON.stringify(j).slice(0, 200)}`);
  const img = await request(proxy, `https://www.google.com/recaptcha/api2/payload?k=${sitekey}&c=${encodeURIComponent(c)}&p=${encodeURIComponent(p)}`, { headers: H, binary: true });
  const mime = /PNG/.test(img.buf.slice(0, 4).toString('latin1')) ? 'image/png' : 'image/jpeg';
  const read = await askVlm(vlmConfig(opts), {
    b64: img.buf.toString('base64'),
    mime,
    proxy,
    instruction: 'This is a reCAPTCHA image challenge. Answer with a JSON object {"instruction":"<the prompt text>","picks":[<0-based tile indices>]} and nothing else.',
  });
  const m = /\[[\s\S]*\]/.exec(read);
  let picks = [];
  try { picks = m ? JSON.parse(m[0]) : []; } catch (e) { picks = []; }
  if (!picks.length) throw fail('captcha-error', `vision model named no tiles: ${read.slice(0, 120)}`);
  const v = await request(proxy, `https://www.google.com/recaptcha/api2/userverify?k=${sitekey}`, {
    method: 'POST',
    headers: Object.assign({ 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', origin: 'https://www.google.com' }, H),
    body: `v=${ver}&c=${encodeURIComponent(c)}&k=${sitekey}&response=${encodeURIComponent(`${p}/${picks.join('/')}`)}`,
  });
  const vj = xssi(v.text);
  log(`reCAPTCHA image round answered (${picks.length} tiles) → ${Array.isArray(vj) ? vj[0] : 'unparsed'}`);
  if (Array.isArray(vj) && vj[0] === 'rresp' && typeof vj[1] === 'string') return { token: vj[1], ms: Date.now() - t0 };
  throw fail('captcha-failed', `image round rejected: ${v.text.slice(0, 160)}`);
}

// ----------------------------------------------------- tencent TCaptcha (HTTP)
const TC_BASE = 'https://turing.captcha.qcloud.com';
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');
/** Tencent's PoW: find the nonce whose md5(prefix+nonce) is the target digest. */
function solvePow(prefix, target, maxNonce = 2000000) {
  for (let i = 0; i < maxNonce; i++) {
    const cand = prefix + i;
    if (md5(cand) === target) return cand;
  }
  throw fail('tencent-pow', 'PoW not solved inside 2e6 nonces');
}
const jsonp = (text) => { const m = /^\s*\w+\s*\(\s*([\s\S]*)\s*\)\s*;?\s*$/.exec(String(text)); try { return JSON.parse(m ? m[1] : text); } catch (e) { return null; } };

/**
 * Tencent TCaptcha, protocol side: `cap_union_prehandle` → solve the challenge
 * (a VLM reads the image) → `cap_union_new_verify`.
 *
 * `sitekey` is the tenant's CaptchaAppId — Tencent challenges are bound to it and
 * there is no universal public one. The verify body also carries Tencent's TDC
 * payload (`collect`/`eks`/`tlg`), which their own `tdc.js` produces from a
 * browser fingerprint; pass it in (`opts.collect`/`opts.eks`/`opts.tlg`, or
 * `TCAPTCHA_COLLECT`/`TCAPTCHA_EKS`/`TCAPTCHA_TLG`) when the tenant enforces it,
 * otherwise this throws `tencent-tdc-required` instead of pretending to pass.
 */
async function solveTencent({ sitekey, url = '', proxy = '', log = () => {} }, opts = {}) {
  if (!sitekey) throw fail('bad-args', 'tencent needs { sitekey } = the tenant CaptchaAppId');
  const t0 = Date.now();
  const entry = url || `${TC_BASE}/`;
  const ua = opts.ua || UA;
  const params = new URLSearchParams({
    aid: sitekey, protocol: 'https', accver: '1', showtype: 'popup', ua: Buffer.from(ua).toString('base64'),
    noheader: '1', fb: '1', aged: '0', enableAged: '0', enableDarkMode: '0', grayscale: '1', clientype: '2',
    cap_cd: '', uid: '', lang: 'zh-cn', entry_url: url, elder_captcha: '0', js: '/tgJCap.627c7f42.js',
    login_appid: '', wb: '1', subsid: '1', callback: `_aq_${Math.floor(Math.random() * 899999 + 100000)}`, sess: '',
  });
  const ph = await request(proxy, `${TC_BASE}/cap_union_prehandle?${params}`, { headers: { 'user-agent': ua, referer: entry } });
  const data = jsonp(ph.text);
  const dyn = data && data.data && data.data.dyn_show_info;
  if (!dyn) throw fail('tencent-prehandle', `prehandle gave no challenge (HTTP ${ph.status}): ${ph.text.slice(0, 200)}`);
  const sess = data.sess || '';
  const bg = dyn.bg_elem_cfg || {};
  const size = Array.isArray(bg.size_2d) ? bg.size_2d : [bg.width || 672, bg.height || 480];
  const bgUrl = bg.img_url || '';
  if (!bgUrl) throw fail('tencent-prehandle', 'challenge without a background image');

  const img = await request(proxy, bgUrl.startsWith('http') ? bgUrl : TC_BASE + bgUrl, { headers: { 'user-agent': ua, referer: 'https://turing.captcha.gtimg.com/' }, binary: true });
  const mime = /PNG/.test(img.buf.slice(0, 4).toString('latin1')) ? 'image/png' : 'image/jpeg';
  const read = await askVlm(vlmConfig(opts), {
    b64: img.buf.toString('base64'),
    mime,
    proxy,
    instruction: `This is a Tencent captcha (${size[0]}x${size[1]} px). The task: "${dyn.instruction || ''}". Answer with JSON {"points":[{"x":<px>,"y":<px>}]} giving the pixel coordinates (origin top-left) of the elements to click, in the order asked. Nothing else.`,
  });
  let pts = [];
  try { pts = JSON.parse((/\[[\s\S]*\]/.exec(read) || ['[]'])[0]).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })); } catch (e) {}
  if (!pts.length) throw fail('tencent-answer', `vision model gave no usable points: ${read.slice(0, 120)}`);
  const ans = JSON.stringify(pts.map((p, i) => ({ elem_id: i + 1, type: 'DynAnswerType_POS', data: `${p.x},${p.y}` })));
  const powCfg = (((data.data || {}).comm_captcha_cfg || {}).pow_cfg) || {};
  const powAnswer = powCfg.prefix && powCfg.md5 ? solvePow(powCfg.prefix, powCfg.md5) : '';
  const collect = opts.collect || process.env.TCAPTCHA_COLLECT || '';
  if (!collect) {
    throw fail(
      'tencent-tdc-required',
      'Tencent verify needs the TDC payload (`collect`) that Tencent\'s own tdc.js builds from a browser fingerprint; ' +
        'pass opts.collect/eks/tlg (or TCAPTCHA_COLLECT/TCAPTCHA_EKS/TCAPTCHA_TLG). ' +
        'Without it Tencent answers errorCode 7/9 — a silent pass is impossible.',
    );
  }
  const body = new URLSearchParams({
    ans, sess, pow_answer: powAnswer, pow_calc_time: String(300 + Math.floor(Math.random() * 200)),
    collect, tlg: String(opts.tlg || process.env.TCAPTCHA_TLG || collect.length), eks: opts.eks || process.env.TCAPTCHA_EKS || '',
  });
  const v = await request(proxy, `${TC_BASE}/cap_union_new_verify`, {
    method: 'POST',
    headers: {
      'user-agent': ua, referer: entry, origin: new URL(entry).origin,
      accept: 'application/json, text/javascript, */*; q=0.01', 'content-type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  let vj = null;
  try { vj = JSON.parse(v.text); } catch (e) { vj = null; }
  if (!vj || String(vj.errorCode) !== '0' || !vj.ticket) {
    throw fail('tencent-verify', `verify refused (errorCode ${vj ? vj.errorCode : '?'} ${vj ? vj.errMessage || vj.errMsg || '' : v.text.slice(0, 120)})`);
  }
  log(`tencent ticket ${String(vj.ticket).slice(0, 12)}… randstr=${String(vj.randstr).slice(0, 8)}…`);
  return { token: vj.ticket, randstr: vj.randstr, ms: Date.now() - t0 };
}

// ------------------------------------------------------------------ dispatch
/**
 * @param {{type:string, sitekey?:string, url?:string, proxy?:string, imageB64?:string}} args
 * @returns {Promise<{token:string, ms:number}>}
 */
async function solveCaptcha(args = {}, opts = {}) {
  const { type, sitekey = '', url = '', proxy = '', imageB64, chromePath = '', timeoutMs = DEFAULT_TIMEOUT_MS, log = () => {} } = args;
  const t0 = Date.now();
  switch (String(type || '').toLowerCase()) {
    case 'turnstile':
    case 'cf-turnstile':
      return solveTurnstile({ sitekey, url, proxy, chromePath, timeoutMs, log });
    case 'hcaptcha':
    case 'h-captcha':
      return solveHcaptcha({ sitekey, url, proxy, chromePath, timeoutMs, log }, opts);
    case 'recaptcha2-image':
    case 'recaptcha':
      return solveRecaptcha2({ sitekey, url, proxy, log }, opts);
    case 'tencent':
      return solveTencent({ sitekey, url, proxy, log }, opts);
    case 'image': {
      const r = await solveImage({ imageB64, proxy, log, instruction: opts.instruction }, opts);
      return { token: r.token, ms: Date.now() - t0 };
    }
    default:
      throw fail('bad-args', `unknown captcha type "${type}" (turnstile | hcaptcha | recaptcha2-image | tencent | image)`);
  }
}

module.exports = { solveCaptcha, findChrome };
