#!/usr/bin/env node
'use strict';

/**
 * Interactive launcher — the one-command path (`npm start` / `node src/launcher.js`).
 *
 * The menu asks one thing (how many keys) and runs `node src/cli.js --auto --count N`.
 * It never asks for a captcha, token or proxy: the captcha step is automatic
 * (--auto — EasyMax's Turnstile is disabled), and `proxies.txt` is picked up by
 * the CLI whenever it exists (otherwise the run is direct).
 *
 * Usage: node src/launcher.js            (menu)
 *        node src/launcher.js --help
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = path.join(ROOT, 'launcher.config.json');
const CLI = path.join(__dirname, 'cli.js');
const KEYS_FILE = path.join(ROOT, 'keys.txt');
const PROXY_FILE = process.env.EASYMAX_PROXIES || 'proxies.txt';

const defaults = {
  count: 10,
  model: 'deepseek-v4.1-flash',
  routerBase: 'http://localhost:20128',
  routerPassword: '123456',
};

function loadConfig() {
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(CONFIG, 'utf8')) };
  } catch (e) {
    return { ...defaults };
  }
}

function saveConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + '\n');
  } catch (e) {
    console.error(`  ! could not write ${path.basename(CONFIG)}: ${e.message}`);
  }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question, fallback) =>
  new Promise((resolve) => {
    const hint = fallback ? ` [${String(fallback).slice(0, 30)}${String(fallback).length > 30 ? '…' : ''}]` : '';
    rl.question(`  ${question}${hint}: `, (answer) => resolve(answer.trim() || fallback || ''));
  });

function run(args, env = {}) {
  console.log('');
  const res = spawnSync(process.execPath, [CLI, ...args], {
    windowsHide: true,
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (res.status !== 0) console.log(`  ! exited with code ${res.status}`);
}

/** Run the CLI with live output, and capture its `__MINT_SUMMARY__` tail. */
function runCapture(args) {
  return new Promise((resolve) => {
    console.log('');
    const child = spawn(process.execPath, [CLI, ...args], { cwd: ROOT, windowsHide: true });
    let out = '';
    child.stdout.on('data', (d) => { out += d; process.stdout.write(d); });
    child.stderr.on('data', (d) => process.stderr.write(d));
    child.on('close', (code) => {
      if (code !== 0) console.log(`  ! exited with code ${code}`);
      const line = out.split(/\r?\n/).filter((l) => l.includes('__MINT_SUMMARY__')).pop();
      let summary = null;
      if (line) {
        try { summary = JSON.parse(line.slice(line.indexOf('__MINT_SUMMARY__') + '__MINT_SUMMARY__'.length).trim()); } catch (e) { summary = null; }
      }
      resolve(summary);
    });
  });
}

function printSummary(s) {
  console.log('');
  console.log('  ── summary ───────────────────────────────────────────────');
  if (!s) {
    console.log('  no machine summary from the CLI — see the log above');
    console.log(`  keys.txt: ${KEYS_FILE}`);
    console.log('  ──────────────────────────────────────────────────────────');
    return;
  }
  const per = s.live ? Math.round(s.ms / s.live) : null;
  console.log(`  live keys   ${s.live}/${s.requested}`);
  console.log(`  latency     ${(s.ms / 1000).toFixed(1)}s total${per != null ? ` · ~${per} ms/key` : ''}`);
  console.log(`  errors      ${s.errors && s.errors.length ? s.errors.join(', ') : 'none'}`);
  console.log(`  keys.txt    ${s.keysFile}`);
  if (s.deadFile) console.log(`  dead keys   ${s.deadFile} (retry on the next run)`);
  console.log('  ──────────────────────────────────────────────────────────');
}

const BANNER_LOGO = String.raw`
███████╗ █████╗ ███████╗██╗   ██╗███╗   ███╗ █████╗ ██╗  ██╗
██╔════╝██╔══██╗██╔════╝╚██╗ ██╔╝████╗ ████║██╔══██╗╚██╗██╔╝
█████╗  ███████║███████╗ ╚████╔╝ ██╔████╔██║███████║ ╚███╔╝
██╔══╝  ██╔══██║╚════██║  ╚██╔╝  ██║╚██╔╝██║██╔══██║ ██╔██╗
███████╗██║  ██║███████║   ██║   ██║ ╚═╝ ██║██║  ██║██╔╝ ██╗
╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
`;

function banner() {
  const cyan = '\x1b[36m';
  const dim = '\x1b[2m';
  const bold = '\x1b[1m';
  const reset = '\x1b[0m';
  const title = 'easymax-bulk-apikey';
  const tagline = 'one account per key — invite-code sign-up funds it, every key chat-verified';
  const lines = BANNER_LOGO.replace(/^\n/, '').replace(/\n$/, '').split('\n');
  const width = Math.max(...lines.map((l) => [...l].length), [...title].length, [...tagline].length);
  const pad = (s) => s + ' '.repeat(width - [...s].length);
  const inner = width + 4;
  console.log('');
  console.log(`${cyan}╔${'═'.repeat(inner)}╗${reset}`);
  console.log(`${cyan}║${' '.repeat(inner)}║${reset}`);
  for (const line of lines) console.log(`${cyan}║${reset}  ${bold}${pad(line)}${reset}  ${cyan}║${reset}`);
  console.log(`${cyan}║${' '.repeat(inner)}║${reset}`);
  console.log(`${cyan}║${reset}  ${pad(title)}  ${cyan}║${reset}`);
  console.log(`${cyan}║${reset}  ${dim}${pad(tagline)}${reset}  ${cyan}║${reset}`);
  console.log(`${cyan}║${' '.repeat(inner)}║${reset}`);
  console.log(`${cyan}╚${'═'.repeat(inner)}╝${reset}`);
  console.log(`  ${dim}easymax-bulk-apikey contributors${reset}`);
  console.log('');
}

async function mintFlow(cfg) {
  cfg.count = Math.max(1, parseInt(await ask('How many keys?', cfg.count), 10) || cfg.count);
  saveConfig(cfg);
  console.log(`  · ${fs.existsSync(path.resolve(ROOT, PROXY_FILE)) ? `using ${PROXY_FILE}` : `no ${PROXY_FILE} — running direct`}`);
  console.log('  · solver: embedded (src/solver.js) — no browser needed (Turnstile is disabled on this panel)');
  const summary = await runCapture(['--auto', '--count', String(cfg.count)]);
  printSummary(summary);
}

async function verifyFlow() {
  run(['--verify-only']);
}

async function screenFlow() {
  run(['--screen']);
}

async function connectFlow(cfg) {
  const { connectKeysFile, connect9Router } = require('./connect-9router.js');
  cfg.routerBase = await ask('9Router base URL', cfg.routerBase);
  cfg.routerPassword = await ask('9Router password', cfg.routerPassword);
  saveConfig(cfg);
  console.log('');
  try {
    await connectKeysFile({ base: cfg.routerBase, password: cfg.routerPassword });
  } catch (e) {
    if (!/no API keys/.test(e.message)) throw e;
    console.log(`  ! ${e.message}`);
    const apiKey = await ask('Single EasyMax key to register');
    if (apiKey) await connect9Router({ base: cfg.routerBase, password: cfg.routerPassword, apiKey });
  }
}

async function connectFlowOmni(cfg) {
  const { connectKeysFile, connectOmniRoute } = require('./connect-omniroute.js');
  cfg.routerBase = await ask('OmniRoute base URL', cfg.routerBase);
  cfg.routerPassword = await ask('OmniRoute password', cfg.routerPassword);
  saveConfig(cfg);
  console.log('');
  try {
    await connectKeysFile({ base: cfg.routerBase, password: cfg.routerPassword });
  } catch (e) {
    if (!/no API keys/.test(e.message)) throw e;
    console.log(`  ! ${e.message}`);
    const apiKey = await ask('Single EasyMax key to register');
    if (apiKey) await connectOmniRoute({ base: cfg.routerBase, password: cfg.routerPassword, apiKey });
  }
}

async function main() {
  const cfg = loadConfig();
  if (process.argv.includes('--connect-9router')) {
    await connectFlow(cfg);
    rl.close();
    return;
  }
  if (process.argv.includes('--connect-omniroute')) {
    await connectFlowOmni(cfg);
    rl.close();
    return;
  }
  banner();
  console.log('  1) Mint keys             — one account per key, each verified by a live chat call');
  console.log('  2) Verify keys           — re-check every key in keys.txt');
  console.log('  3) Screen proxies        — test your proxy list against EasyMax');
  console.log('  4) Settings              — what this launcher remembers');
  console.log('  5) Help                  — CLI options and notes');
  console.log('  6) Connect to 9Router');
  console.log('  7) Connect to OmniRoute');
  console.log('  q) Quit\n');
  const choice = (await ask('Choose', '1')).toLowerCase();

  if (choice === '1') await mintFlow(cfg);
  else if (choice === '2') await verifyFlow();
  else if (choice === '3') await screenFlow();
  else if (choice === '4') console.log('\n' + JSON.stringify(cfg, null, 2));
  else if (choice === '5') run(['--help']);
  else if (choice === '6') await connectFlow(cfg);
  else if (choice === '7') await connectFlowOmni(cfg);
  rl.close();
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Interactive launcher: run `node src/launcher.js` and pick a menu item.');
  console.log('  npm start   or   node src/launcher.js');
  console.log('Non-interactive equivalent: node src/cli.js --auto --count N');
  process.exit(0);
}

main().catch((e) => {
  console.error('[fatal]', e.message);
  process.exit(1);
});
