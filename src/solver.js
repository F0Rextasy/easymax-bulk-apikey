'use strict';

/**
 * EasyMax captcha step.
 *
 * EasyMax (a New API panel) ships with Cloudflare Turnstile **disabled**: its
 * register and login endpoints are called as `POST /api/user/register?turnstile=`
 * and `POST /api/user/login?turnstile=`, and the panel accepts an **empty** value
 * (measured 2026-10-19 — see repo-spec.json `freeTier` / `how`). No browser, no
 * token and no third-party solver is involved, so the embedded solver simply
 * returns the empty token the panel's own flow already uses.
 *
 * The module keeps the shared one-command contract so the CLI stays uniform with
 * every other bulk-apikey repo:
 *
 *   const { solveCaptcha } = require('./solver.js');
 *   const { token, ms } = await solveCaptcha({ type, sitekey, url, proxy });
 *   // token: returned untrimmed. A real Error on failure (no silent null).
 *
 * If the panel ever turns Turnstile on, this is the single place to swap in a
 * browser solver: launch a headful Chrome (`CHROME_PATH`, or a browser found on
 * the host — a headless host cannot clear the widget), render the widget for the
 * panel's sitekey and return its token. Until then there is nothing to solve.
 */

/** Provider window namespace — only meaningful once a browser solver lands here. */
const NS = '__easymax';

async function solveCaptcha({ type = 'turnstile' } = {}) {
  const t0 = Date.now();
  if (type !== 'turnstile') {
    throw new Error(`solveCaptcha: unsupported type "${type}" (EasyMax registers with a disabled Cloudflare Turnstile)`);
  }
  return { token: '', ms: Date.now() - t0 };
}

module.exports = { NS, solveCaptcha };
