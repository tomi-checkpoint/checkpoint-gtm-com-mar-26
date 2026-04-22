# Plan: Cloudflare reverse proxy cutover for checkpointgtm.com

**Status:** Ready to execute
**Created:** 2026-04-21
**Owner:** Noah / Tomi
**Estimated effort:** ~4 hours total work, spread over 1–2 days

## Goal

Publish the new GitHub Pages–hosted website at the root domain `checkpointgtm.com` **without breaking** any existing HubSpot assets (meeting links, forms, tracking pixels, blog pages, email CTAs).

## Strategy

Put Cloudflare in front of `checkpointgtm.com`. A Cloudflare Worker inspects the incoming request path and routes it to the right origin:

- `/meetings/*`, `/forms/*`, `/blog/*` (and any other HubSpot-managed paths) → proxied to HubSpot
- Everything else → proxied to GitHub Pages (the new site)

This preserves every existing URL while letting us serve the new site from the root domain.

## Prerequisites — run BEFORE starting

### 1. URL audit (CRITICAL — do not skip)

We need a complete inventory of every HubSpot URL in the wild before we touch DNS. If we miss one, links break silently.

**Check these sources:**

| Source | What to look for |
|---|---|
| HubSpot → Marketing → Website Pages | All pages hosted at `checkpointgtm.com/*` |
| HubSpot → Conversations → Meetings → Meeting Links | Exact URL for each scheduler |
| HubSpot → Marketing → Forms → Embedded | Any form URLs shared directly |
| HubSpot → Marketing → Blog | Blog URL structure (`/blog/*` or custom) |
| Google Search Console → Performance | Top indexed URLs on the domain |
| Email signatures (Noah, Tomi, team) | Meeting link URLs in use |
| Live email campaigns | HubSpot → Marketing → Email → filter by Sent → check CTA URLs |
| Partner/directory listings | Where has checkpointgtm.com been submitted |
| DNS records already pointing to HubSpot | `dig checkpointgtm.com ANY` |

**Deliverable:** a flat list of path patterns that must remain HubSpot-routed. Save as `docs/plans/hubspot-routes.md`.

Example expected output:
```
/meetings/*          → must route to HubSpot (meeting scheduler)
/forms/*             → must route to HubSpot (form submissions)
/blog/*              → must route to HubSpot (blog CMS)
/landing/*           → must route to HubSpot (campaign LPs)
/_hcms/*             → must route to HubSpot (HubSpot internal assets)
/_hubspot/*          → must route to HubSpot (tracking)
```

### 2. Cloudflare account check

- Confirm which Cloudflare account owns the DNS (if any). If DNS is still at GoDaddy/other, we'll need to migrate it to Cloudflare first (free plan is fine).
- Current Checkpoint Cloudflare account ID (from crikket config): `b88b56a1f23bce8a6e750adca036fd12`
- Check if `checkpointgtm.com` is already in that account

### 3. GitHub Pages CNAME

- Current repo: `tomi-checkpoint/checkpoint-gtm-com-mar-26`
- Pages is already configured with `testcheckpointsite.gotomarketpro.eu` as custom domain
- For production we'll either:
  - **(a)** change the Pages custom domain to `checkpointgtm.com` directly, OR
  - **(b)** keep the test domain and have the Worker fetch from `tomi-checkpoint.github.io` directly

Option (b) is safer for staged rollout — do that.

## Execution steps

### Step 1: DNS setup (30 min)

1. Ensure `checkpointgtm.com` is on Cloudflare (migrate nameservers from current registrar if needed; propagation can take up to 24h, so do this day 0)
2. Keep existing DNS records for HubSpot unchanged for now
3. Add proxy-enabled (orange cloud) A/CNAME records so Cloudflare is in the request path

### Step 2: Write the Worker (1 hr)

Create a new Cloudflare Worker with this routing logic:

```javascript
// checkpointgtm-router
// Routes requests between HubSpot (legacy) and GitHub Pages (new)

const HUBSPOT_ORIGIN = 'https://<hubspot-domain-or-current-host>'
const GITHUB_PAGES_ORIGIN = 'https://tomi-checkpoint.github.io/checkpoint-gtm-com-mar-26'

// Path prefixes that MUST go to HubSpot
// Populate this from the URL audit
const HUBSPOT_PREFIXES = [
  '/meetings/',
  '/forms/',
  '/blog/',
  '/_hcms/',
  '/_hubspot/',
  '/hs/',
  // add more from audit
]

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Special case: HubSpot tracking and internal paths
    if (HUBSPOT_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
      return proxyTo(HUBSPOT_ORIGIN, request, url)
    }

    // Everything else: new site
    return proxyTo(GITHUB_PAGES_ORIGIN, request, url)
  }
}

async function proxyTo(origin, request, url) {
  const upstream = new URL(origin + url.pathname + url.search)
  const modified = new Request(upstream, request)
  // Preserve original Host if HubSpot needs it
  modified.headers.set('X-Forwarded-Host', url.hostname)
  return fetch(modified)
}
```

**Important considerations:**
- Don't proxy `Cookie` from HubSpot responses to new site or vice versa — can leak session state
- Preserve `X-HubSpot-*` headers on HubSpot-bound requests
- Return a clean 404 page for paths that don't exist on the new site (otherwise GitHub Pages 404 will leak)

### Step 3: Update origins & configs (30 min)

Before binding the Worker to the domain:

1. **Crikket:** Add `https://checkpointgtm.com` to the Turnstile allowlist and R2 CORS:
   ```bash
   ~/.claude/skills/crikket/bin/crikket add-site https://checkpointgtm.com
   ```

2. **GitHub Pages CNAME:** Update the CNAME file or GitHub Pages settings to accept `checkpointgtm.com` (either custom domain or add it alongside the test domain)

3. **Internal links:** The site currently uses absolute paths (`/services/...`). Those work on any host. No changes needed.

4. **Asset paths:** All CSS/JS/images use relative paths — no changes needed.

### Step 4: Staged rollout (2 hr + 24h monitoring)

Do not do a big-bang cutover. Stage it:

1. **Stage A — Test domain only**
   - Bind the Worker to `staging.checkpointgtm.com` first
   - Verify every HubSpot path still works (test 10+ meeting links, submit a form, load the blog)
   - Verify the new site loads at the root
   - Test Crikket widget still appears and can submit a bug

2. **Stage B — Main domain, paused**
   - Bind Worker to `checkpointgtm.com` but keep DNS pointing at HubSpot still
   - Test via `curl --resolve` and `X-Forwarded-Host` headers

3. **Stage C — Full cutover**
   - Flip the root A/CNAME record to the Cloudflare Worker
   - Propagation: ~minutes with a low TTL
   - Monitor Cloudflare analytics and Crikket bug inbox for 24 hours

4. **Stage D — Rollback plan**
   - If anything breaks, revert the DNS change (single click in Cloudflare)
   - Or disable the Worker route (Worker stops intercepting, requests hit origin directly)

### Step 5: Post-cutover validation (30 min)

Verify end-to-end:

- [ ] `https://checkpointgtm.com/` loads the new site
- [ ] `https://checkpointgtm.com/meetings/noah` loads the HubSpot scheduler
- [ ] `https://checkpointgtm.com/blog/*` (if applicable) loads HubSpot blog
- [ ] Submit a test form → it arrives in HubSpot
- [ ] HubSpot tracking pixel still fires (check in HubSpot Contacts activity)
- [ ] Crikket widget appears bottom-right on all new-site pages
- [ ] Crikket widget can submit a test bug with screenshot
- [ ] SSL certificate valid (Cloudflare issues automatically)
- [ ] Core Web Vitals: measure LCP/CLS before and after to catch regressions
- [ ] Google Search Console: check for crawl errors over the next week

## Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missed a HubSpot path in the audit | Medium | High | Add a "catch-all" fallback in the Worker — if the new site returns 404, retry against HubSpot before serving 404 to user |
| Cookie leakage between origins | Low | Medium | Don't pass cookies through in the Worker; set Cookie domain scoping explicitly |
| SSL issues during DNS propagation | Low | Low | Cloudflare Full (strict) SSL with origin cert; test before cutover |
| HubSpot meeting widget iframe breaks | Medium | High | Check Content-Security-Policy on HubSpot responses, ensure Cloudflare doesn't strip `frame-ancestors` |
| GitHub Pages rate limit on proxy | Low | Low | GH Pages is 100GB/month soft limit; use Cloudflare cache for the new site |
| Tracking analytics breaks | Low | Medium | HubSpot tracking script runs client-side; should work unchanged as long as domain stays checkpointgtm.com |

## Future migration path (Q3 or later)

Once this proxy setup is stable, consider the cleaner long-term architecture:

1. Move meeting links to `meetings.checkpointgtm.com` (HubSpot supports custom meeting subdomains in settings)
2. Move blog to `blog.checkpointgtm.com` if the blog stays on HubSpot, OR migrate blog content to the new site
3. Simplify the Worker to just forwarding tracking pixels
4. Eventually: retire the Worker entirely once HubSpot dependencies are all on subdomains

## Ownership & escalation

- **Primary:** Noah (site + Crikket)
- **HubSpot audit:** Tomi (who knows what lives where in HubSpot)
- **DNS / Cloudflare:** Noah (already has Cloudflare account access via Crikket setup)
- **Rollback authority:** anyone with Cloudflare access — one-click revert

## Checklist for execution

- [ ] Step 0: URL audit complete, `hubspot-routes.md` saved
- [ ] Step 1: DNS on Cloudflare
- [ ] Step 2: Worker written, routing rules populated from audit
- [ ] Step 3: Crikket origins updated, GitHub Pages CNAME ready
- [ ] Step 4A: Staging test passed
- [ ] Step 4B: Worker bound to production domain (paused)
- [ ] Step 4C: DNS cutover, 24h monitoring
- [ ] Step 5: Post-cutover validation all green
- [ ] Announcement: team knows site is live at checkpointgtm.com

## Related docs

- Site source: `/` (this repo)
- Deploy target: GitHub Pages on `tomi-checkpoint/checkpoint-gtm-com-mar-26`
- Crikket widget integration: every page, bottom-right
- Original project brief: `/CLAUDE.md`
