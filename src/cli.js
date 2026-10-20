#!/usr/bin/env node
'use strict';

/**
 * easymax-bulk-apikey CLI — mint EasyMax accounts, one API key per account, and
 * keep only the keys that survived a live chat call.
 *
 * Flow, per account, every panel request through one pinned exit from your pool:
 *   1. mailbox    broker `POST /create` (primary) → emailnator → generated address
 *   2. register   `POST /api/user/register?turnstile= {username,password,email,aff_code}`
 *                 the invite code is what funds the account: a plain sign-up gets
 *                 quota 0 and its key answers 403, `aff_code` → 250000 quota
 *                 (measured 2026-10-19 on this panel)
 *   3. login      `POST /api/user/login?turnstile=`   → access_token
 *   4. account    `GET  /api/user/self`               → id + quota
 *   5. key        `POST /api/token/ {group}` then `POST /api/token/<id>/key`
 *                 (every later call carries `New-Api-User: <id>`)
 *   6. gate       `POST /v1/chat/completions`         → 200 with real content = keep
 *
 * A key is appended to `keys.txt` only *after* step 6 answers 200 — a key that
 * never passes is recorded in `accounts.json` and retried on the next run.
 *
 * Options:
 *   --count N        accounts (= keys) to mint                     [5]
 *   --conc N         accounts in flight at once, max 16            [1]
 *   --gap MS         pause between rounds inside a worker          [1200]
 *   --model <id>     model used for the live gate       [deepseek-v4.1-flash]
 *   --group <name>   token group the key is created in            [deepseek]
 *   --aff <code>     invite code used at sign-up (this is the quota source)
 *   --pool <file>    proxy list, one exit per line (env EASYMAX_PROXIES) [optional]
 *   --broker <urls>  inbox broker base URL(s), comma separated
 *                                 [http://127.0.0.1:9700,http://127.0.0.1:9701]
 *   --inbox <chain>  mailbox rail order                       [broker,emailnator,local]
 *   --mail-domain D  domain used by the `local` rail                     [qq.com]
 *   --tries N        exits tried per account before giving up             [2]
 *   --timeout MS     per-request timeout                                 [60000]
 *   --verify-only    re-run every key in keys.txt through the chat gate
 *   --screen         only test the proxy list against EasyMax
 *   --help
 *
 * Zero dependencies. Node.js >= 18. Your proxy list is OPTIONAL: pass --pool
 * (or the EASYMAX_PROXIES env) and every request goes through an exit from it;
 * without a pool the tool connects directly.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');
const http = require('http');
const { URL } = require('url');

// Shipped as `<repo>/src/cli.js`; in the lab it sits in `providers/easymax/`,
// so both layouts must resolve the same repo root for keys.txt / accounts.json.
const ROOT = path.basename(__dirname) === 'src' ? path.resolve(__dirname, '..') : __dirname;
const KEYS_FILE = path.join(ROOT, 'keys.txt');
const UNGATED_FILE = path.join(ROOT, 'keys-ungated.txt');
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');

const BASE = 'https://easymax.ai';
const EMAILNATOR = 'https://www.emailnator.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

// ------------------------------------------------------------------- options

const argv = process.argv.slice(2);
function arg(name, dflt) {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return dflt;
}
const has = (name) => argv.includes(`--${name}`);

if (has('help') || has('h')) {
  console.log(`easymax-bulk-apikey — mint EasyMax accounts, one key each, verified by a live chat call.

  node src/cli.js --count 50         mint (a key is kept only after a chat 200)
  node src/cli.js --verify-only      re-check every key in keys.txt
  node src/cli.js --screen           test your proxy list against EasyMax
  node src/cli.js --help

  --count N      accounts to mint                                  [5]
  --conc N       accounts in flight (max 16)                       [1]
  --model <id>   model used for the live gate        [deepseek-v4.1-flash]
  --group <name> token group the key is created in               [deepseek]
  --aff <code>   invite code used at sign-up (grants the 250k quota)
  --pool <file>  proxy list, one exit per line (env EASYMAX_PROXIES) [optional]
  --broker <u>   inbox broker base URL(s), comma separated
  --inbox <c>    mailbox rail order                  [broker,emailnator,local]

Requests go through your proxy list when one is provided (--pool / env).
Without a pool the tool connects directly.`);
  process.exit(0);
}

const COUNT = Math.max(1, parseInt(arg('count', '5'), 10) || 5);
const CONC = Math.min(16, Math.max(1, parseInt(arg('conc', '1'), 10) || 1));
const GAP_MS = Math.max(0, parseInt(arg('gap', '1200'), 10) || 0);
const TRIES = Math.max(1, parseInt(arg('tries', '2'), 10) || 2);
const TIMEOUT_MS = Math.max(5000, parseInt(arg('timeout', '60000'), 10) || 60000);
const MODEL = arg('model', 'deepseek-v4.1-flash');
const GROUP = arg('group', 'deepseek');
const AFF = arg('aff', 'LQ5onYuWhA3V');
const MAIL_DOMAIN = arg('mail-domain', 'qq.com');
const BROKERS = arg('broker', 'http://127.0.0.1:9700,http://127.0.0.1:9701')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const INBOX = arg('inbox', 'broker,emailnator,local')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const PROXY_FILE = process.env.EASYMAX_PROXIES || arg('pool', arg('proxies', 'proxies.txt'));
const VERIFY_ONLY = has('verify-only');
const SCREEN_ONLY = has('screen');

// ------------------------------------------------------------------ helpers

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jparse = (s) => {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
};
const maskExit = (line) => String(line || 'direct').replace(/:[^:@/]+@/, ':***@');
const randUser = () => 'r' + Math.random().toString(36).slice(2, 11);
const randPass = () => 'Ex' + Math.random().toString(36).slice(2, 10) + '!7a';
function say(msg) {
  console.log(`${new Date().toISOString().slice(11, 19)} ${msg}`);
}

function loadExits() {
  const file = path.resolve(ROOT, PROXY_FILE);
  if (!fs.existsSync(file)) {
    // No pool = DIRECT mode: a proxy is recommended at scale (per-IP limits,
    // bans) but the tool works without one. `null` is the direct sentinel.
    say(`no proxy list at ${PROXY_FILE} — running WITHOUT a proxy (direct). Put exits there (or pass --pool) to route through them.`);
    return [null];
  }
  const exits = fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('#') && !s.startsWith('//'));
  if (!exits.length) {
    say(`proxy list ${PROXY_FILE} has no usable exits — running WITHOUT a proxy (direct).`);
    return [null];
  }
  return exits;
}

// ------------------------------------------------------------------- tunnel

/**
 * Accepted line shapes: `host:port`, `socks5://host:port`, `socks4a://host:port`,
 * and any of them with a `user:pass` pair in front of the host — credentials are
 * honoured for the http and socks5 schemes.
 */
function parseExit(line) {
  const m = /^(?:(socks5h|socks5|socks4a|socks4|https|http):\/\/)?(?:([^:@/\s]+):([^@/\s]*)@)?([^:/\s]+):(\d{1,5})$/.exec(
    String(line || '').trim()
  );
  if (!m) return null;
  return {
    protocol: (m[1] || 'http').toLowerCase(),
    username: m[2] ? decodeURIComponent(m[2]) : null,
    password: m[3] !== undefined && m[2] ? decodeURIComponent(m[3]) : null,
    host: m[4],
    port: Number(m[5]),
  };
}

/** Reads exactly `n` bytes; anything past `n` is pushed back for the caller. */
function readExactly(sock, n, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (sock.__leftover && sock.__leftover.length >= n) {
      const out = sock.__leftover.slice(0, n);
      sock.__leftover = sock.__leftover.slice(n);
      return resolve(out);
    }
    let buf = sock.__leftover || Buffer.alloc(0);
    sock.__leftover = Buffer.alloc(0);
    if (buf.length >= n) {
      const out = buf.slice(0, n);
      sock.__leftover = buf.slice(n);
      return resolve(out);
    }
    const timer = setTimeout(() => {
      sock.removeListener('data', onData);
      sock.removeListener('error', onErr);
      reject(new Error('tunnel handshake timeout'));
    }, timeoutMs);
    const onData = (d) => {
      buf = Buffer.concat([buf, d]);
      if (buf.length >= n) {
        clearTimeout(timer);
        sock.removeListener('data', onData);
        sock.removeListener('error', onErr);
        sock.__leftover = buf.slice(n);
        resolve(buf.slice(0, n));
      }
    };
    const onErr = (e) => {
      clearTimeout(timer);
      sock.removeListener('data', onData);
      reject(e);
    };
    sock.on('data', onData);
    sock.on('error', onErr);
  });
}

/** CONNECT tunnel through an http/https exit; leftover proxy bytes are unshifted. */
async function httpTunnel(exit, host, port, timeoutMs) {
  const sock = await new Promise((resolve, reject) => {
    const s =
      exit.protocol === 'https'
        ? tls.connect({ host: exit.host, port: exit.port, servername: exit.host })
        : net.connect({ host: exit.host, port: exit.port });
    s.setTimeout(timeoutMs, () => s.destroy(new Error('exit connect timeout')));
    s.once(exit.protocol === 'https' ? 'secureConnect' : 'connect', () => resolve(s));
    s.once('error', reject);
  });
  const auth =
    exit.username && exit.password
      ? `Proxy-Authorization: Basic ${Buffer.from(`${exit.username}:${exit.password}`).toString('base64')}\r\n`
      : '';
  sock.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n${auth}\r\n`);
  const head = await new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => {
      sock.removeListener('data', onData);
      reject(new Error('exit CONNECT timeout'));
    }, timeoutMs);
    const onData = (d) => {
      buf = Buffer.concat([buf, d]);
      const end = buf.indexOf('\r\n\r\n');
      if (end === -1) {
        if (buf.length > 8192) {
          clearTimeout(timer);
          sock.removeListener('data', onData);
          reject(new Error('exit sent an oversized CONNECT response'));
        }
        return;
      }
      clearTimeout(timer);
      sock.removeListener('data', onData);
      sock.__leftover = buf.slice(end + 4);
      resolve(buf.slice(0, end).toString('latin1'));
    };
    sock.on('data', onData);
  });
  const line = head.split('\r\n')[0];
  if (!/^HTTP\/1\.[01] 200/.test(line)) throw new Error(`exit CONNECT refused: ${line}`);
  return sock;
}

/** SOCKS5 (no-auth or user/pass) CONNECT. */
async function socks5Tunnel(exit, host, port, timeoutMs) {
  const needAuth = Boolean(exit.username);
  const sock = await new Promise((resolve, reject) => {
    const s = net.connect({ host: exit.host, port: exit.port });
    s.setTimeout(timeoutMs, () => s.destroy(new Error('exit connect timeout')));
    s.once('connect', () => resolve(s));
    s.once('error', reject);
  });
  sock.write(needAuth ? Buffer.from([5, 2, 0, 2]) : Buffer.from([5, 1, 0]));
  const greeting = await readExactly(sock, 2, timeoutMs);
  if (greeting[0] !== 5) throw new Error('socks5: bad greeting');
  if (greeting[1] === 2) {
    const u = Buffer.from(exit.username || '');
    const p = Buffer.from(exit.password || '');
    sock.write(Buffer.concat([Buffer.from([1, u.length]), u, Buffer.from([p.length]), p]));
    const auth = await readExactly(sock, 2, timeoutMs);
    if (auth[1] !== 0) throw new Error('socks5: auth rejected');
  } else if (greeting[1] !== 0) {
    throw new Error('socks5: no acceptable auth method');
  }
  const name = Buffer.from(host);
  if (name.length > 255) throw new Error('socks5: host too long');
  sock.write(Buffer.concat([Buffer.from([5, 1, 0, 3, name.length]), name, Buffer.from([port >> 8, port & 0xff])]));
  const head = await readExactly(sock, 4, timeoutMs);
  if (head[1] !== 0) throw new Error(`socks5: CONNECT refused (${head[1]})`);
  const tail = head[3] === 1 ? 4 + 2 : head[3] === 4 ? 16 + 2 : (await readExactly(sock, 1, timeoutMs))[0] + 2;
  await readExactly(sock, tail, timeoutMs);
  return sock;
}

/** SOCKS4 / SOCKS4a CONNECT. */
async function socks4Tunnel(exit, host, port, timeoutMs) {
  const sock = await new Promise((resolve, reject) => {
    const s = net.connect({ host: exit.host, port: exit.port });
    s.setTimeout(timeoutMs, () => s.destroy(new Error('exit connect timeout')));
    s.once('connect', () => resolve(s));
    s.once('error', reject);
  });
  const isV4a = exit.protocol === 'socks4a' || !/^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const ip = isV4a ? Buffer.from([0, 0, 0, 1]) : Buffer.from(host.split('.').map(Number));
  const user = Buffer.from(exit.username || '');
  const body = Buffer.concat([
    Buffer.from([4, 1, port >> 8, port & 0xff]),
    ip,
    user,
    Buffer.from([0]),
    isV4a ? Buffer.concat([Buffer.from(host), Buffer.from([0])]) : Buffer.alloc(0),
  ]);
  sock.write(body);
  const res = await readExactly(sock, 8, timeoutMs);
  if (res[1] !== 90) throw new Error(`socks4: CONNECT refused (${res[1]})`);
  return sock;
}

async function openTunnel(exit, host, port, timeoutMs) {
  if (exit.protocol === 'socks5' || exit.protocol === 'socks5h') return socks5Tunnel(exit, host, port, timeoutMs);
  if (exit.protocol === 'socks4' || exit.protocol === 'socks4a') return socks4Tunnel(exit, host, port, timeoutMs);
  return httpTunnel(exit, host, port, timeoutMs);
}

/** A raw socket straight to host:port (no proxy) — the direct-mode twin of openTunnel. */
function directTunnel(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host, port });
    sock.setTimeout(timeoutMs, () => sock.destroy(new Error('connect timeout')));
    sock.once('connect', () => resolve(sock));
    sock.once('error', reject);
  });
}

/**
 * One HTTPS request through `exit`, or straight out when no exit is configured
 * (the proxy list is optional; a pool is recommended at scale).
 */
function exitRequest(exitLine, url, { method = 'GET', headers = {}, body = null, timeoutMs = TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const exit = exitLine ? parseExit(exitLine) : null;
    if (exitLine && !exit) return reject(new Error(`unparseable exit ${maskExit(exitLine)}`));
    const u = new URL(url);
    const payload =
      body === null || body === undefined
        ? null
        : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const hs = {
      host: u.host,
      'user-agent': UA,
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'identity',
      origin: BASE,
      referer: `${BASE}/`,
      connection: 'close',
      ...headers,
    };
    if (payload) {
      hs['content-type'] = hs['content-type'] || 'application/json';
      hs['content-length'] = String(payload.length);
    }
    const head =
      `${method} ${u.pathname}${u.search} HTTP/1.1\r\n` +
      Object.entries(hs)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n') +
      '\r\n\r\n';
    let settled = false;
    const fail = (e) => {
      if (settled) return;
      settled = true;
      reject(e);
    };
    let tlsSock = null;
    (exit ? openTunnel(exit, u.hostname, Number(u.port || 443), Math.min(timeoutMs, 20000)) : directTunnel(u.hostname, Number(u.port || 443), Math.min(timeoutMs, 20000)))
      .then((tunnel) => {
        const leftover = tunnel.__leftover;
        tunnel.__leftover = Buffer.alloc(0);
        tunnel.pause();
        tunnel.removeAllListeners('data');
        if (leftover && leftover.length) tunnel.unshift(leftover);
        tlsSock = tls.connect({ socket: tunnel, servername: u.hostname }, () => {
          tlsSock.write(head);
          if (payload) tlsSock.write(payload);
        });
        tlsSock.setTimeout(timeoutMs, () => tlsSock.destroy(new Error('timeout')));
        let raw = Buffer.alloc(0);
        let headEnd = -1;
        let status = 0;
        let respHeaders = {};
        let closed = false;
        const finish = (text) => {
          if (settled) return;
          settled = true;
          tlsSock.destroy();
          resolve({
            status,
            headers: respHeaders,
            text,
            json: jparse(text),
            setCookie: respHeaders['set-cookie'] ? [respHeaders['set-cookie']] : [],
          });
        };
        /** `null` while the chunked body is still incomplete. */
        const dechunk = (buf) => {
          const parts = [];
          let i = 0;
          for (;;) {
            const nl = buf.indexOf('\r\n', i);
            if (nl === -1) return null;
            const size = parseInt(buf.slice(i, nl).toString('latin1').split(';')[0], 16);
            if (!Number.isFinite(size)) return null;
            if (size === 0) return Buffer.concat(parts);
            if (buf.length < nl + 2 + size + 2) return null;
            parts.push(buf.slice(nl + 2, nl + 2 + size));
            i = nl + 2 + size + 2;
          }
        };
        const pump = () => {
          if (headEnd === -1) {
            headEnd = raw.indexOf('\r\n\r\n');
            if (headEnd === -1) return;
            const headText = raw.slice(0, headEnd).toString('latin1');
            status = parseInt(headText.split('\r\n')[0].split(' ')[1] || '0', 10);
            for (const line of headText.split('\r\n').slice(1)) {
              const i = line.indexOf(':');
              if (i > 0) respHeaders[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
            }
          }
          const body = raw.slice(headEnd + 4);
          if ((respHeaders['transfer-encoding'] || '').toLowerCase().includes('chunked')) {
            const done = dechunk(body);
            if (done) finish(done.toString('utf8'));
            return;
          }
          if (respHeaders['content-length'] !== undefined) {
            const len = parseInt(respHeaders['content-length'], 10);
            if (body.length >= len) finish(body.slice(0, len).toString('utf8'));
            return;
          }
          if (closed) finish(body.toString('utf8'));
        };
        tlsSock.on('data', (d) => {
          raw = Buffer.concat([raw, d]);
          pump();
        });
        tlsSock.on('end', () => {
          closed = true;
          pump();
        });
        tlsSock.on('error', fail);
        tlsSock.on('close', () => fail(new Error('connection closed before a response')));
      })
      .catch(fail);
  });
}

/** Retrying wrapper — a dead exit hands the account to the next one in the pool. */
async function exitJson(exits, exitLine, url, opts = {}, tries = 3) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    const px = i === 0 ? exitLine : exits[(exits.indexOf(exitLine) + i * 7 + 1) % exits.length];
    try {
      const r = await exitRequest(px, url, opts);
      if (r.status === 429 || r.status >= 500) {
        last = new Error(`HTTP ${r.status} via ${maskExit(px)}: ${String(r.text).slice(0, 100)}`);
        await sleep(2500 * (i + 1));
        continue;
      }
      return r;
    } catch (e) {
      last = new Error(`${e.message} via ${maskExit(px)}`);
      await sleep(1200 * (i + 1));
    }
  }
  throw last || new Error('request failed');
}

/** Loopback service call (the inbox broker lives on your machine). */
function localJson(url, { method = 'POST', body = null, timeoutMs = 45000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload =
      body === null || body === undefined ? null : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const req = http.request(
      {
        method,
        host: u.hostname,
        port: u.port || 80,
        path: u.pathname + u.search,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(payload ? { 'content-length': String(payload.length) } : {}),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let t = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (t += c));
        res.on('end', () => resolve({ status: res.statusCode || 0, text: t, json: jparse(t) }));
      }
    );
    req.on('timeout', () => req.destroy(new Error('broker timeout')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ------------------------------------------------------------------ mailbox

let mailStats = {};

/**
 * Address for one account. Rails in `--inbox` order; the panel only stores the
 * address (measured: no verification mail is ever required), so a rail outage
 * costs one step, never the account.
 */
async function claimMailbox(exits, exitLine) {
  const errors = [];
  for (const rail of INBOX) {
    try {
      if (rail === 'broker') {
        for (const base of BROKERS) {
          const r = await localJson(`${base.replace(/\/+$/, '')}/create`);
          const address = r.json && (r.json.address || r.json.email);
          if (address) {
            mailStats.broker = (mailStats.broker || 0) + 1;
            return { rail: `broker:${new URL(base).port}`, address };
          }
          errors.push(`broker ${base}: ${String(r.text).slice(0, 90)}`);
        }
        continue;
      }
      if (rail === 'emailnator') {
        const r = await exitJson(exits, exitLine, `${EMAILNATOR}/api/generate-email`, {
          method: 'POST',
          body: { ids: [3] },
          headers: { origin: EMAILNATOR, referer: `${EMAILNATOR}/` },
        });
        const address = r.json && r.json.email;
        if (address) {
          mailStats.emailnator = (mailStats.emailnator || 0) + 1;
          return { rail: 'emailnator', address };
        }
        errors.push(`emailnator: ${String(r.text).slice(0, 90)}`);
        continue;
      }
      if (rail === 'local') {
        mailStats.local = (mailStats.local || 0) + 1;
        return { rail: 'local', address: `${randUser()}@${MAIL_DOMAIN}` };
      }
      errors.push(`unknown rail ${rail}`);
    } catch (e) {
      errors.push(`${rail}: ${e.message}`);
    }
  }
  throw new Error(`no mailbox rail answered (${errors.join(' | ')})`);
}

// --------------------------------------------------------------------- flows

function appendKey(key) {
  fs.appendFileSync(KEYS_FILE, `${key}\n`);
}

let writeChain = Promise.resolve();
function recordAccount(rec) {
  writeChain = writeChain
    .then(() => {
      let arr = [];
      try {
        const parsed = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
        if (Array.isArray(parsed)) arr = parsed;
      } catch (e) {
        /* first record */
      }
      arr.push(rec);
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(arr, null, 2) + '\n');
    })
    .catch(() => {});
  return writeChain;
}

async function signUp(exits, exitLine) {
  const username = randUser();
  const password = randPass();
  const box = await claimMailbox(exits, exitLine);
  const reg = await exitJson(exits, exitLine, `${BASE}/api/user/register?turnstile=`, {
    method: 'POST',
    body: { username, password, email: box.address, aff_code: AFF },
  });
  if (!(reg.json && reg.json.success)) {
    return { username, password, box, error: `register HTTP ${reg.status}: ${String(reg.text).slice(0, 160)}` };
  }
  const lg = await exitJson(exits, exitLine, `${BASE}/api/user/login?turnstile=`, {
    method: 'POST',
    body: { username, password },
  });
  const token = lg.json && lg.json.data && lg.json.data.access_token;
  if (!token) return { username, password, box, error: `login HTTP ${lg.status}: ${String(lg.text).slice(0, 160)}` };
  const me = await exitJson(exits, exitLine, `${BASE}/api/user/self`, { headers: { authorization: `Bearer ${token}` } });
  const data = (me.json && me.json.data) || {};
  const auth = { authorization: `Bearer ${token}` };
  if (data.id) auth['New-Api-User'] = String(data.id);
  const created = await exitJson(exits, exitLine, `${BASE}/api/token/`, {
    method: 'POST',
    headers: auth,
    body: {
      name: 'k1',
      remain_quota: 500000,
      expired_time: -1,
      unlimited_quota: false,
      model_limits_enabled: false,
      model_limits: '',
      allow_ips: '',
      group: GROUP,
    },
  });
  let key = null;
  const dd = created.json && created.json.data;
  if (dd && dd.key && !String(dd.key).includes('*')) key = dd.key;
  if (!key && dd && dd.id) {
    const kr = await exitJson(exits, exitLine, `${BASE}/api/token/${dd.id}/key`, { method: 'POST', headers: auth, body: {} });
    const kd = kr.json && kr.json.data;
    const kk = typeof kd === 'string' ? kd : kd && kd.key;
    if (kk && !String(kk).includes('*')) key = kk;
  }
  if (!key) {
    const tl = await exitJson(exits, exitLine, `${BASE}/api/token/?p=0&size=10`, { headers: auth });
    const items = (tl.json && tl.json.data && tl.json.data.items) || [];
    for (const t of items) {
      if (t.key && !String(t.key).includes('*')) {
        key = t.key;
        break;
      }
      if (t.id) {
        const kr = await exitJson(exits, exitLine, `${BASE}/api/token/${t.id}/key`, { method: 'POST', headers: auth, body: {} });
        const kd = kr.json && kr.json.data;
        const kk = typeof kd === 'string' ? kd : kd && kd.key;
        if (kk && !String(kk).includes('*')) {
          key = kk;
          break;
        }
      }
    }
  }
  return { username, password, box, quota: data.quota, uid: data.id, key };
}

/** The gate: a key is live only when the model answers 200 with real output. */
async function chatGate(exits, exitLine, key, model = MODEL) {
  const r = await exitJson(
    exits,
    exitLine,
    `${BASE}/v1/chat/completions`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${key}` },
      body: { model, messages: [{ role: 'user', content: 'Reply with just "ok"' }], max_tokens: 16 },
      timeoutMs: Math.max(TIMEOUT_MS, 90000),
    },
    2
  );
  const j = r.json;
  const choice = j && j.choices && j.choices[0];
  const msg = (choice && choice.message) || {};
  const text = `${msg.content || ''}${msg.reasoning_content || ''}`.trim();
  const completion = ((j && j.usage) || {}).completion_tokens || 0;
  return {
    ok: r.status === 200 && (text.length > 0 || completion > 0),
    status: r.status,
    text: text.slice(0, 60),
    error: r.status === 200 ? '' : String(r.text).slice(0, 160),
  };
}

async function mintOne(exits, startExit, index) {
  for (let attempt = 0; attempt < TRIES; attempt++) {
    const exitLine = attempt === 0 ? startExit : exits[(exits.indexOf(startExit) + attempt * 3 + 1) % exits.length];
    let acct = null;
    try {
      acct = await signUp(exits, exitLine);
      if (acct.error) {
        say(`  ✗ #${index + 1} ${acct.error}`);
        continue;
      }
      if (!acct.key) {
        say(`  ✗ #${index + 1} ${acct.username}: no key issued (quota ${acct.quota})`);
        continue;
      }
      const gate = await chatGate(exits, exitLine, acct.key);
      const rec = {
        index: index + 1,
        username: acct.username,
        password: acct.password,
        email: acct.box.address,
        mailbox: acct.box.rail,
        uid: acct.uid,
        quota: acct.quota,
        api_key: acct.key,
        group: GROUP,
        model: MODEL,
        chat_status: gate.status,
        chat: gate.text,
        chat_error: gate.error,
        exit: maskExit(exitLine),
        verdict: gate.ok ? 'LIVE' : 'key-no-chat',
        at: new Date().toISOString(),
      };
      await recordAccount(rec);
      if (!gate.ok) {
        say(`  ✗ #${index + 1} ${acct.username}: key ${acct.key.slice(0, 8)}… failed the gate (HTTP ${gate.status}) ${gate.error}`);
        continue;
      }
      appendKey(acct.key);
      say(`  ✓ #${index + 1} ${acct.username} → ${acct.key.slice(0, 8)}…  quota ${acct.quota}  chat ${gate.status} ${gate.text}`);
      return rec;
    } catch (e) {
      say(`  ✗ #${index + 1} attempt ${attempt + 1} via ${maskExit(exitLine)}: ${e.message}`);
      await sleep(1500 * (attempt + 1));
    }
  }
  await recordAccount({ index: index + 1, verdict: 'failed', at: new Date().toISOString() });
  return null;
}

async function screen(exits) {
  say(`screening ${exits.filter(Boolean).length || 'direct'} exit(s) against ${new URL(BASE).host}`);
  const live = [];
  let cursor = 0;
  const workers = Array.from({ length: CONC }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= exits.length) return;
      const exitLine = exits[i];
      try {
        const r = await exitRequest(exitLine, `${BASE}/api/status`, { timeoutMs: 25000 });
        if (r.status === 200) {
          if (exitLine) live.push(exitLine);
          say(`  ✓ ${maskExit(exitLine)} ${r.status}`);
        } else {
          say(`  ✗ ${maskExit(exitLine)} ${r.status}`);
        }
      } catch (e) {
        say(`  ✗ ${maskExit(exitLine)} ${e.message}`);
      }
    }
  });
  await Promise.all(workers);
  fs.writeFileSync(path.join(ROOT, 'proxies.live.txt'), live.join('\n') + (live.length ? '\n' : ''));
  say(`screen done: ${live.length}/${exits.length} live → proxies.live.txt`);
}

async function verifyOnly(exits) {
  if (!fs.existsSync(KEYS_FILE)) {
    console.error(`! ${path.basename(KEYS_FILE)} not found — nothing to verify`);
    process.exit(2);
  }
  const keys = fs
    .readFileSync(KEYS_FILE, 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  say(`re-checking ${keys.length} key(s) with model ${MODEL}`);
  const live = [];
  const dead = [];
  for (let i = 0; i < keys.length; i++) {
    const exitLine = exits[i % exits.length];
    try {
      const gate = await chatGate(exits, exitLine, keys[i]);
      if (gate.ok) {
        live.push(keys[i]);
        say(`  ✓ ${keys[i].slice(0, 8)}… ${gate.status} ${gate.text}`);
      } else {
        dead.push(keys[i]);
        say(`  ✗ ${keys[i].slice(0, 8)}… HTTP ${gate.status} ${gate.error}`);
      }
    } catch (e) {
      dead.push(keys[i]);
      say(`  ✗ ${keys[i].slice(0, 8)}… ${e.message}`);
    }
  }
  fs.writeFileSync(KEYS_FILE, live.join('\n') + (live.length ? '\n' : ''));
  if (dead.length) fs.writeFileSync(UNGATED_FILE, dead.join('\n') + '\n');
  say(`verify done: ${live.length} live, ${dead.length} dead`);
}

async function mint(exits) {
  say(
    `minting ${COUNT} account(s), conc ${CONC}, model ${MODEL}, group ${GROUP}, ` +
      `${exits.filter(Boolean).length ? `${exits.filter(Boolean).length} exit(s)` : 'direct (no proxy)'}, inbox ${INBOX.join('→')}`
  );
  let cursor = 0;
  let ok = 0;
  let failed = 0;
  const workers = Array.from({ length: CONC }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= COUNT) return;
      const rec = await mintOne(exits, exits[i % exits.length], i);
      if (rec && rec.verdict === 'LIVE') ok++;
      else failed++;
      if (GAP_MS) await sleep(GAP_MS);
    }
  });
  await Promise.all(workers);
  await writeChain;
  const rails = Object.entries(mailStats)
    .map(([k, v]) => `${k} ${v}`)
    .join(', ');
  say(`done: ${ok} live key(s), ${failed} failed — keys.txt${rails ? ` · mailbox: ${rails}` : ''}`);
  if (!ok) process.exitCode = 1;
}

(async () => {
  const exits = loadExits();
  if (SCREEN_ONLY) return screen(exits);
  if (VERIFY_ONLY) return verifyOnly(exits);
  return mint(exits);
})().catch((e) => {
  console.error('[fatal]', e.message);
  process.exit(1);
});
