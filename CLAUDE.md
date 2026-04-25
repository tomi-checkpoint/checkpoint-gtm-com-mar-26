# Checkpoint GTM Website — Project Context

## Repository
GitHub: `noahatcheckpoint/checkpoint-gtm-com-mar-26`

## What This Is
Premium, conversion-oriented website for Checkpoint GTM — a Berlin-based RevOps and GTM consultancy for B2B SaaS companies, startups, and VC-backed teams. The site is built as static HTML/CSS/JS intended for deployment into HubSpot Design Manager.

## Tech Stack
- Vanilla HTML5, CSS3 (custom properties, grid, flexbox), JavaScript (no frameworks)
- Canvas API for hero particle animation
- Node.js `server.js` for local dev (`node server.js` on port 8080)
- No build step, no transpilation

## File Structure
```
checkpoint-gtm/
├── index.html              # Homepage
├── about.html              # About page
├── case-studies.html        # Case studies listing
├── contact.html             # Contact form page
├── server.js                # Local dev server
├── css/
│   ├── global.css           # Design tokens, typography, layout, utilities
│   ├── components.css       # UI components, cards, buttons, grids, partner/cert sections
│   └── animations.css       # Keyframes, reveal classes, marquee, reduced motion
├── js/
│   ├── hero-particles.js    # Canvas checkmark → explosion animation (scroll-driven)
│   ├── hero-parallax.js     # Hero card parallax, cursor reactivity, idle float
│   ├── scroll-animations.js # IntersectionObserver reveals, cert badge scatter/converge, partner grid stagger
│   ├── nav.js               # Sticky nav, mobile menu toggle
│   └── theme-toggle.js      # Light/dark mode with localStorage
├── images/
│   ├── certifications/      # HubSpot Platinum + Salesforce Admin badges (1893×1855px each)
│   ├── partners/            # 11 technology partner logos (green-tinted via CSS filter)
│   └── clients/             # 13 client logos (used in marquee scroll)
└── services/
    ├── index.html                  # Services overview
    ├── hubspot-implementation.html
    ├── revenue-operations.html
    ├── gtm-strategy.html
    ├── crm-migration.html
    ├── marketing-operations.html
    ├── ai-automation.html
    └── vc-portfolio-support.html
```

## What's Built (Complete)

### Homepage Sections (top to bottom)
1. **Hero** — Fixed viewport with canvas particle checkmark that explodes on scroll. Badge ("Embedded RevOps & GTM Partner"), headline, subtitle, dual CTAs, scroll indicator
2. **Certification badges** — HubSpot Platinum + Salesforce Admin (position:fixed, scatter→converge during hero scroll, fade out as partner grid approaches)
3. **Technology Partners grid** — 11 partner logos in 4-column card grid, staggered slide-in animation (IntersectionObserver), green-tinted via CSS filter
4. **Client logo marquee** — Two rows scrolling opposite directions on green background, 13 client logos, case study clients are clickable links
5. **Problem statement** — 2-column "Most B2B teams scale by stacking headcount and tools"
6. **Services grid** — 7 service cards linking to subpages
7. **How We Work** — 5-step process: Discovery → Design → Build → Launch → Optimize
8. **Differentiators** — 3-column (embedded model, EMEA-native, 40+ implementations)
9. **Proof module** — Featured case study with 3x metric + quote
10. **Testimonials** — 3 testimonial cards (placeholder avatars)
11. **Metrics bar** — 40+ implementations, 50+ companies, 3 languages, 9+ countries
12. **Engagement models** — 4 cards (project, retainer, fractional, workshop)
13. **Final CTA** — Book discovery call
14. **Footer** — Nav links, legal, LinkedIn

### Other Pages
- **About** — Differentiators, process, stats, values (production-ready)
- **Case Studies** — 5 case study cards with real metrics/summaries (production-ready)
- **Case Study Detail Pages** — 5 subpages under `case-studies/`: `series-a-revops`, `series-b-transformation`, `crm-migration`, `gtm-market-entry`, `vc-portfolio` (Sprint 2)
- **Team** — `team.html` with member profiles and EMEA/VC positioning (Sprint 2)
- **Contact** — 2-column form with role/need dropdowns (form action="#", needs backend)
- **Services Index** — 7 service cards + engagement models + process
- **7 Service Subpages** — Each has hero, deep-dive sections, process, use cases, CTA (60-70% content depth)

### Key Animations
- Hero checkmark particles: idle rotation (0-10% scroll), explosion (10-80%), clear (80-100%)
- Hero parallax cards with cursor reactivity and idle float
- Certification badges: random scatter → center converge (scroll-driven, position:fixed), smooth fade as partner grid approaches
- Partner grid: staggered reveal from 3 directions (left, bottom, right) via IntersectionObserver
- Client logo marquee: CSS keyframe infinite scroll, two rows opposite directions
- Section reveals: translateY + opacity with stagger delays
- Dark/light mode toggle

### Design System
- **Palette**: Neutral (#FAFAF8 bg, #1A1A1A text) with accent green (#2D6A4F) and warm orange (#E8985E)
- **Typography**: Roboto Slab (display), Inter (body)
- **Spacing**: 4px–128px scale via CSS custom properties
- **Dark mode**: Full support via `data-theme="dark"` with inverted tokens

## What's NOT Built Yet

### Dynamic Regeneration (Core Requirement)
The site is currently 100% static. The original brief requires meaningful content regeneration based on visitor persona:

**7 audience modes to support:**
1. Seed/early-stage founder with GTM chaos
2. Series A/B revenue leader needing infrastructure
3. Marketing leader needing attribution and lifecycle rigor
4. CS/ops leader needing onboarding and renewal systems
5. VC platform team seeking portfolio-wide support
6. Company migrating from Salesforce/Pipedrive/Attio to HubSpot
7. Buyer exploring AI + automation in GTM systems

**Per audience, regenerate:**
- Hero headline and supporting copy
- Recommended services (reorder/highlight)
- Featured case studies
- Proof modules
- Process framing
- CTA copy
- Next-step suggestions

**Implementation approach needed:**
- Visitor detection (query params, cookies, form input, referrer heuristics)
- Content variant data structure (persona → content mapping)
- JS rendering logic to rewrite DOM sections
- Consider HubSpot smart content or server-side rendering

### Other Gaps
- Contact form backend (currently action="#", needs HubSpot form or serverless function)
- Testimonial avatar images (currently empty placeholder divs)
- Service subpage content depth (some pages need expanded copy)
- Workflow / dashboard screenshots in case study detail pages (needs anonymized client assets — Sprint 2 P3.3, deferred)
- SEO meta tags / Open Graph tags (partially done)
- HubSpot Design Manager deployment
- Analytics / tracking integration

## Shipped Sprints
- **Sprint 2** (verified 2026-04-24) — all 27 Crikket bug reports addressed except P3.3 (workflow screenshots, gated on client assets). Full breakdown: `docs/sprint-2-verification.md`. Case study detail pages, Team page, dark-mode contrast fixes, service link routing, footer nav, and consistency pass all landed.

## Client Logos with Case Studies
Companies marked with ✓ have testimonials and should link to case study pages:
Staffbase ✓, Duel ✓, Rasa ✓, Voize ✓, Professional.me ✓, re-green ✓, LIQID Finance ✓

## Development
```bash
cd checkpoint-gtm
node server.js
# Opens at http://localhost:8080
```

Or use the `.claude/launch.json` config with preview tools.

## Design Inspiration
- ColdIQ (coldiq.com) — structural inspiration for logo scroll, trust signals, modular service architecture
- Maze (maze.co) — inspiration for partner card grid animation (cards sliding up from bottom in organized grid)
- Do NOT copy wording, branding, or visual identity from either

## Key Design Decisions Made
- Hero uses canvas particle checkmark (not video or static image)
- Certification badges animate during hero scroll (scatter→converge), stay visible until partner section wipes them
- Partner logos are in-flow content AFTER hero (not overlaid), with green CSS filter tint
- Client logo scroll uses green background with lighter green recolored logos
- Motion is restrained and scroll-driven — no autoplay, no gimmicks
- Neutral palette with strategic use of green (#2D6A4F) and warm orange (#E8985E)
