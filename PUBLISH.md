# Publish — Read Lite plugin

This package is built, type-checked (`tsc` clean), runtime-loaded,
test-verified (5/5 under `bun test`), and `npm pack --dry-run` verified.
It has **not** been published or pushed — that is the parent agent's /
Wilfred's step, mirroring how `@thewinnerscircle/plugin-token-verdict`
and `@thewinnerscircle/plugin-deal-verdict` were published on
2026-11-25.

## Notes carried over from the sibling publishes

- **Scope is already correct.** The npm package is
  `@thewinnerscircle/plugin-read-lite` — `thewinnerscircle` is
  Wilfred's own npm username/scope (recovered and verified 2026-11-25),
  so there is no scope rejection to fix. The internal plugin name stays
  `plugin-read-lite`.
- **There is no registry PR step anymore.** The old
  `elizaos-plugins/registry` GitHub repo **no longer exists** (verified
  2026-11-25: the repo 404s and the `elizaos-plugins` org is empty —
  "Plugins have been migrated into the elizaos/eliza core repo"). The
  current ElizaOS registry **syncs automatically from npm**, so
  publishing the npm package is the registry submission. Do NOT go
  looking for a registry repo to PR against.
- **Repo topics are a registry requirement.** When the GitHub repo is
  created, set its topics to: `elizaos-plugins`, `elizaos`, `x402`
  (same as the token-verdict and deal-verdict repos).

## Publish steps

```bash
# 1. GitHub repo (parent agent does this in Wilfred's Chrome, signed in
#    as Spacemandomains — same as elizaos-plugin-token-verdict)
#    Create public repo: Spacemandomains/elizaos-plugin-read-lite
#    Then set repo topics: elizaos-plugins, elizaos, x402

# 2. Push this folder (git is already initialised, main branch, one commit)
git remote add origin git@github.com:Spacemandomains/elizaos-plugin-read-lite.git
git push -u origin main
# (On this VM, pushes need the blocking-proxy SSH variant:
#  GIT_SSH_COMMAND="ssh -F /home/hatch/.ssh/config -o ProxyCommand='python3 /home/hatch/.ssh/proxy-connect-blocking.py %h %p'")

# 3. Publish to npm — on Wilfred's Mac, where npm is logged in as
#    thewinnerscircle (2FA security key "AI Agent" enabled; a publish
#    will prompt for the key / browser auth, as the sibling publishes did)
cd elizaos-plugin-read-lite
npm publish --access public
# → package live at
#   https://www.npmjs.com/package/@thewinnerscircle/plugin-read-lite
# → registry picks it up via the automatic npm sync (no PR)

# Optional CLI validation first (Mac, home-prefix install — global
# /usr/local install fails with EACCES and bare npx does not launch
# the elizaos binary):
npm install -g --prefix ~/.npm-global @elizaos/cli
~/.npm-global/bin/elizaos publish --test
```

Fallback if `elizaos publish --test` complains about anything: the
plain `npm publish --access public` above is sufficient — it is how
the sibling plugins' npm side landed, and the registry sync only
needs npm + the repo topics.

## Verified before handoff (2026-11-25, Muse VM, nothing paid)

- Live endpoint dry-run: unpaid POST returned HTTP 402; decoded
  `payment-required` header (x402 v2): amount 5000 atomic USDC =
  **$0.005**, network **eip155:8453 (Base)**, asset USDC
  `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`,
  payTo `0xea8B7221507d1A0549e1ab96000a54401A7fDaC1`,
  maxTimeoutSeconds 300. Nothing was paid.
- Request/response schema (from the endpoint source + Bazaar
  discovery extension): request `{ url: string }`; response
  `{ url, title, excerpt, markdown, wordCount }`; failed extraction
  returns HTTP 502 and is never settled.
- `npm run build` (tsc) — clean, exit 0.
- Runtime load of `dist/index.js` — plugin `plugin-read-lite`,
  actions `[READ_URL_LITE]`.
- `READ_URL_LITE.validate()` — true with a URL in the message,
  false without.
- `parseReadMessage()` — extracts the first URL and strips trailing
  sentence punctuation; returns no url when the message has none.
- `bun test` — 5 pass, 0 fail.
- `npm pack --dry-run` — 8 files, tarball verified (dist, images,
  README, package.json).
- Images: `images/logo.jpg` 400×400 (<500 KB); `images/banner.jpg`
  1280×640 (<1 MB) — both meet registry sizes.
