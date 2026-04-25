# Checkpoint GTM Website — Sprint 2 Improvement Plan

**Source**: 27 user feedback reports collected via Crikket on 2026-04-21
**Site**: https://testcheckpointsite.gotomarketpro.eu
**Repo**: https://github.com/tomi-checkpoint/checkpoint-gtm-com-mar-26
**Project root**: `/Users/noah/Documents/New Products/New Website/checkpoint-gtm/`

---

## Priority Legend

| Priority | Label | Action |
|----------|-------|--------|
| P0 | **Blocker** | Broken pages, dead links — fix immediately |
| P1 | **High** | Visually broken or confusing — fix this sprint |
| P2 | **Medium** | Design inconsistency or missing content — fix this sprint |
| P3 | **Low** | Polish, copy tweaks, nice-to-have — schedule |

---

## P0 — BLOCKERS (fix first)

### 0.1 · Broken service page links from homepage (404 errors)

**Bugs**: #019 (critical), #022 (critical)
**Page**: Homepage → Services grid
**Problem**: The "Revenue Operations" card links to `/services/revops` and "Marketing Operations" links to `/services/marketing-ops`, but the actual files are `/services/revenue-operations.html` and `/services/marketing-operations.html`. GitHub Pages serves static files — without a rewrite layer, the links 404.

**Screenshot context**: Bug #019 shows the user circling the Revenue Operations card; clicking "Learn more" leads to a 404.

**Fix approach**:
1. Open `index.html`, find the services grid section
2. Fix the `href` on the Revenue Operations card: change `/services/revops` → `/services/revenue-operations`
3. Fix the `href` on the Marketing Operations card: change `/services/marketing-ops` → `/services/marketing-operations`
4. Also audit ALL service card links on the homepage AND on `/services/index.html` to confirm every href matches the actual filename (check hubspot, gtm-strategy, crm-migration, ai-automation, vc-portfolio-support too)
5. Verify each link resolves to a 200

**Files**: `index.html`, `services/index.html`

---

### 0.2 · Case study detail pages don't exist

**Bug**: #012 (critical)
**Page**: Case Studies
**Problem**: The "Read the full story →" links on case study cards point to `#` — nothing opens. The user explicitly says: "the full stories don't open up - create sub pages for each of those."

**Fix approach**:
1. Create individual case study pages under `/case-studies/` directory (e.g., `case-studies/series-a-revops.html`, `case-studies/crm-migration.html`, etc.)
2. Each page should follow the service page template pattern: hero with company context, challenge section, approach section, results with metrics, testimonial quote, CTA
3. Use the existing case study card data (title, summary, metrics, company context) as the foundation — expand each into a full narrative page
4. Update the href on each case study card in `case-studies.html` to point to the new subpage
5. There are 5 case studies on the current page — create 5 corresponding detail pages

**Files**: Create `case-studies/` directory with 5 new HTML files; update `case-studies.html`

---

### 0.3 · Footer navigation links are not clickable

**Bug**: #014 (high)
**Page**: Homepage footer
**Problem**: The footer nav links (Services, Case Studies, About, Contact) appear as text but are not wrapped in `<a>` tags or the `href` is missing/broken. Screenshot shows the footer with non-functional navigation.

**Fix approach**:
1. Open `index.html`, find the footer section
2. Verify each navigation link in the footer has a proper `<a href="...">` tag
3. The links should point to: `/services`, `/case-studies`, `/about`, `/contact`
4. Since this is GitHub Pages with .html extensions, ensure links resolve correctly — may need `.html` suffixes
5. Check footer links on ALL pages (the footer is duplicated in every HTML file)

**Files**: All 13 HTML files (footer section)

---

## P1 — VISUAL BUGS (fix this sprint)

### 1.1 · Partner logos are inconsistent colors in dark mode

**Bug**: #003 (high)
**Page**: Homepage → Technology Partners section
**Problem**: Screenshot shows partner logos in dark mode where some logos appear in different shades of green/teal/blue against dark cards. HubSpot is orange text, Salesforce is teal, Apollo is gray/green, etc. User says: "partner logos should all be in the same color and readable: either green or white."

**Fix approach**:
1. Open `css/components.css`, find the partner grid filter rules
2. The current filter chain (`grayscale → brightness → sepia → saturate → hue-rotate`) produces inconsistent results across logos with different original colors
3. For dark mode specifically, add a `[data-theme="dark"]` override that makes all logos uniformly white or light green:
   - Option A (white): `filter: grayscale(100%) brightness(10) contrast(0.5);` — makes all logos white
   - Option B (green): `filter: grayscale(100%) brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(100deg) brightness(0.8);`
4. Also check light mode — the green tinting should be more uniform there too

**Files**: `css/components.css`

---

### 1.2 · Hero badge text invisible in dark mode

**Bug**: #004 (medium)
**Page**: Homepage hero
**Problem**: The "Embedded RevOps & GTM Partner" badge/bubble text disappears against the dark background because the badge uses a light green background with dark text that doesn't adapt to dark mode.

**Screenshot context**: Shows the hero in dark mode — the checkmark particles are green/orange on black, the heading "Revenue systems designed to scale" is visible, but the badge above it is nearly invisible.

**Fix approach**:
1. Find the `.badge` styles — likely in `css/components.css` or inline in `index.html`
2. Add a `[data-theme="dark"]` rule that sets the badge background to a visible color (e.g., `rgba(45, 106, 79, 0.3)` with `color: #52B788` or white text)
3. Verify the badge is readable against both the hero background and the particle animation

**Files**: `css/components.css` or `index.html` (inline styles)

---

### 1.3 · About page: CTA heading invisible in dark mode

**Bug**: #005 (medium)
**Page**: About → Final CTA section
**Problem**: "Ready to build your revenue engine?" heading is nearly invisible — dark gray text on dark background. Screenshot shows it's extremely low contrast.

**Fix approach**:
1. The section uses `section--dark` class — the heading inside needs to inherit inverse text color
2. Check if the h2 inside the dark CTA section is using `var(--text-primary)` which may not invert in dark mode inside a `section--dark`
3. Force the heading to use white/light color: `color: rgba(250, 250, 248, 0.95)` or `color: var(--text-inverse)`

**Files**: `about.html` (and check all pages with `section--dark` CTA blocks)

---

### 1.4 · About page: stat numbers low contrast in dark mode

**Bug**: #006 (medium)
**Page**: About → "By the Numbers" section
**Problem**: The stats bar (50+, 12+, 500+, 3x) has very low contrast — numbers and labels barely visible against the dark background. User says: "numbers should be in a more visible color: either bright green or white."

**Screenshot context**: Shows the stats section with barely readable numbers and labels.

**Fix approach**:
1. The stat section likely uses `section--dark` — find the `.stat-block__number` and `.stat-block__label` rules
2. In the `[data-theme="dark"]` context inside a `section--dark`, the numbers should be `color: #52B788` (bright green) or white
3. Labels should be `rgba(250, 250, 248, 0.7)` for readable secondary text

**Files**: `about.html`, `css/components.css`

---

### 1.5 · Engagement model icons inconsistent

**Bug**: #015 (low)
**Page**: Homepage → "How to Work With Us" section
**Problem**: The 4 engagement model cards use different icon styles — the first icon (gear/settings) is smaller than the others, and the last icon (pencil/workshop) appears to be in a different style (outlined orange instead of filled black). Screenshot clearly shows the size and style mismatch.

**Fix approach**:
1. Open `index.html`, find the engagement card section
2. The icons are HTML entities (&#9881;, &#8635;, &#9733;, &#9997;) which render inconsistently across browsers — some as emoji, some as text glyphs
3. Replace ALL engagement card icons with consistent SVGs from the same icon set, all at the same size (24px), all using `var(--text-primary)` color
4. Use simple SVG icons: settings gear, refresh/cycle, star, book/training

**Files**: `index.html`

---

### 1.6 · RevOps flywheel arrows overlap text

**Bug**: #013 (medium)
**Page**: Revenue Operations → flywheel diagram
**Problem**: The flywheel arrows (Leads, Customers, Advocates) overlap with the node text. The bottom arrow is asymmetric. User says: "adjust the visuals so that the arrows don't cover the text and make the whole visual symmetric."

**Screenshot context**: Shows "Advocates" arrow cutting through the Marketing node text, and the bottom curved arrow being lopsided.

**Fix approach**:
1. Open `services/revenue-operations.html`, find the flywheel SVG/CSS
2. Adjust arrow paths so they route BETWEEN nodes, not through them
3. Make the three connection arrows equidistant and symmetric around the circle
4. Consider using dashed arcs instead of straight arrows to create cleaner separation
5. Ensure all three label positions (Leads, Customers, Advocates) are placed along the arcs, not overlapping node content

**Files**: `services/revenue-operations.html`

---

## P2 — DESIGN CONSISTENCY & CONTENT

### 2.1 · Service page icon sizes and colors inconsistent

**Bugs**: #018 (medium — VC Portfolio), #021 (medium — AI & Automation)
**Pages**: `/services/vc-portfolio-support`, `/services/ai-automation`
**Problem**: Icon sizes and green shades vary across service pages. Some icons are smaller, some use a different shade of green for the icon background.

**Fix approach**:
1. Audit ALL service pages for `.deliver-card__icon` styles
2. Standardize icon size to `width: 40px; height: 40px` with SVG icons at `20px`
3. Standardize icon background: `rgba(45, 106, 79, 0.1)` with `color: var(--accent)`
4. Compare against homepage service card icons for consistency

**Files**: All service subpage HTML files (inline styles)

---

### 2.2 · Page title font sizes inconsistent across pages

**Bugs**: #008 (low — Case Studies), #009 (low — Services)
**Pages**: Case Studies hero, Services hero
**Problem**: The h1 title on Case Studies and Services is larger than the About page title. User wants them all the same size.

**Fix approach**:
1. All page hero h1 elements should use `font-size: clamp(2rem, 4vw, 2.75rem)` consistently
2. Check `case-studies.html` and `services/index.html` — their hero h1 may be inheriting the global h1 size (`clamp(2.25rem, 5vw, 4rem)`) instead of the normalized service page size
3. Add explicit `font-size: clamp(2rem, 4vw, 2.75rem)` to both page heroes

**Files**: `case-studies.html`, `services/index.html`

---

### 2.3 · About page: icon sizes in "What Makes Us Different" section

**Bug**: #011 (low)
**Page**: About → differentiator cards
**Problem**: The white icons in the cards are different sizes. User says: "make the white icons in the same size."

**Fix approach**:
1. Read `about.html`, find the differentiator/feature cards section
2. Check each card's icon element — they may be using different SVG viewBox sizes or different inline width/height
3. Standardize all icons to the same dimensions (e.g., `width: 24px; height: 24px`)

**Files**: `about.html`

---

### 2.4 · Homepage "Problem" section: right-side paragraphs need visual hierarchy

**Bug**: #023 (low)
**Page**: Homepage → "The Problem" section
**Problem**: The two paragraphs on the right side of the problem section are in the same font size and weight. User says: "make the two paragraphs in the same font size, but include a symbol to make the second one stand out."

**Screenshot context**: Shows the 2-column layout with "Most B2B teams scale by stacking headcount and tools" on the left, and two paragraphs of body text on the right with no visual differentiation.

**Fix approach**:
1. Find the problem section in `index.html`
2. Keep both paragraphs at the same font size
3. Add a visual differentiator to the second paragraph: a left border accent (e.g., `border-left: 3px solid var(--accent); padding-left: var(--space-md);`), or prefix it with a → arrow or ✓ checkmark symbol
4. The second paragraph is the "here's what we do" message — it should feel like the answer/solution

**Files**: `index.html`

---

### 2.5 · Testimonial copy feels fake

**Bug**: #016 (low)
**Page**: Homepage → Testimonials
**Problem**: The third testimonial about "RevOps function that actually works" feels generic. User says: "this marketing testimonial sounds a bit fake - lets change it to revops function was upgraded."

**Fix approach**:
1. Find the third testimonial in `index.html`
2. Rewrite it to sound more specific and credible, e.g.:
   - "Our RevOps function went from reactive firefighting to a proper system. Attribution, lifecycle stages, lead scoring — all connected and driving decisions we trust."
3. Consider changing the attribution from "VP Marketing" to something more specific

**Files**: `index.html`

---

### 2.6 · Homepage engagement card "3 black bubbles" not visible enough

**Bug**: #002 (low)
**Page**: Homepage → engagement cards (or similar section)
**Problem**: Three visual elements described as "black bubbles" are not visible enough. User wants them in beige or green.

**Fix approach**: Identify which elements the user is referring to by reviewing screenshot, then adjust their background color.

**Files**: `index.html`, `css/components.css`

---

## P3 — CONTENT ADDITIONS

### 3.1 · Add missing client logos to marquee

**Bugs**: #024 (low), #025 (medium)
**Page**: Homepage → client logo scroll
**Problem**: Missing logos. User requests adding:
- From #024: voize.de, re-green, appmagic.rocks, trustyou.com, lano
- From #025: Smartlead, Instantly, Glyphic.ai, Attio CRM, Claude Code, Lusha
- All logos should be the same height

**Fix approach**:
1. Source/create logo PNG files for each company (transparent background)
2. Resize all to consistent height (match existing logo heights)
3. Add to `images/clients/` directory
4. Add `<img>` tags to both marquee rows in `index.html`
5. For logos that represent case study clients, wrap in `<a>` tags linking to case study pages

**Files**: `index.html`, new image files in `images/clients/`

---

### 3.2 · Add "Meet the Team" page

**Bugs**: #007 (medium — contact page suggestion), #017 (low — VC portfolio page suggestion)
**Problem**: User wants a "Meet the Team" page with team members, partner links, and VC platform expertise. Suggested from both the Contact page and the VC Portfolio Support page.

**Fix approach**:
1. Create a new `team.html` page following the existing page template pattern
2. Include team member profiles with: name, photo placeholder, role, bio, LinkedIn link
3. Highlight VC platform expertise for the VC-oriented audience
4. Add "Meet the Team" link to the nav on relevant pages (About, Contact, VC Portfolio)
5. This is new content — will need team member information from the client

**Files**: New `team.html`, update nav in relevant pages

---

### 3.3 · Case studies: add workflow screenshots

**Bug**: #001 (low)
**Page**: Case Studies
**Problem**: User says: "include some screenshots of workflows we've built and how we've implemented AI at some clients." This is about showing visual proof of implementation depth.

**Fix approach**:
1. When creating case study detail pages (P0.2), include a "What we built" section with annotated screenshots of HubSpot workflows, dashboards, or automation sequences
2. These will need to be sourced from actual client work (anonymized if needed)
3. Use a lightbox or modal pattern for full-size image viewing

**Files**: Case study detail pages (created in P0.2)

---

### 3.4 · AI & Automation page title punctuation

**Bug**: #020 (low)
**Page**: AI & Automation → hero
**Problem**: The title has full stops (periods) that other service pages don't. User suggests replacing with: "Automate the work. Augment the team." (two sentences) or removing the periods entirely to match other pages.

**Fix approach**:
1. Read the current title in `services/ai-automation.html`
2. Update to: "Automate the work Augment the team" (no periods, matching other service page style)
3. Or use the two-line format without periods to match the pattern of other service hero titles

**Files**: `services/ai-automation.html`

---

### 3.5 · About page: section label update

**Bug**: #010 (low)
**Page**: About → Values section
**Problem**: User feedback says: "what we believe in" — suggesting the section heading should be "What we believe in" instead of whatever it currently says (likely "Our Values" or "What we believe").

**Fix approach**: Check current heading text and update if needed.

**Files**: `about.html`

---

### 3.6 · Case Studies page: intro copy tweak

**Bug**: #026 (low)
**Page**: Case Studies → hero
**Problem**: User says "teams that want to scale" — likely a suggested copy change for the intro text. Check current intro and adjust phrasing.

**Files**: `case-studies.html`

---

## EXECUTION ORDER

**Sprint 2A — Blockers (do first)**:
1. Fix all broken service page links (P0.1)
2. Fix footer navigation links (P0.3)
3. Create case study detail pages (P0.2)

**Sprint 2B — Visual fixes**:
4. Fix dark mode: partner logos, badge, about page heading/stats (P1.1-1.4)
5. Replace engagement model icons with consistent SVGs (P1.5)
6. Fix RevOps flywheel arrow overlaps (P1.6)

**Sprint 2C — Consistency pass**:
7. Standardize service page icon sizes/colors (P2.1)
8. Standardize page title font sizes (P2.2)
9. Fix about page icon sizes (P2.3)
10. Add visual hierarchy to problem section (P2.4)
11. Rewrite fake-sounding testimonial (P2.5)

**Sprint 2D — Content additions**:
12. Add missing client logos (P3.1)
13. Update AI page title (P3.4)
14. Update about page section labels (P3.5)
15. Create "Meet the Team" page (P3.2 — needs client input)
16. Add workflow screenshots to case studies (P3.3 — needs client assets)

---

## VERIFICATION CHECKLIST

After all fixes, verify:
- [ ] Every nav link on every page resolves (no 404s)
- [ ] Every footer link on every page resolves
- [ ] Every service card "Learn more" link on homepage resolves
- [ ] Every case study "Read the full story" link resolves
- [ ] Dark mode: all text readable on all pages
- [ ] Dark mode: partner logos uniformly colored
- [ ] Dark mode: all badges/bubbles visible
- [ ] Icon sizes uniform within each section
- [ ] Page title sizes consistent across all non-homepage pages
- [ ] All client logos in marquee same height
- [ ] RevOps flywheel labels don't overlap nodes
- [ ] Test on mobile viewport (375px) — no horizontal overflow

---

## SCREENSHOTS REFERENCE

All 27 bug screenshots are in:
`/Users/noah/Documents/New Products/New Website/crikket-export-all-2026-04-21/bugs/`

Each bug directory contains `report.md` and `screenshot.png`. The screenshot shows exactly what the user was looking at when they filed the report, with their annotation/circle highlighting the issue.

Key screenshots to reference during implementation:
- Bug #003: Partner logos dark mode colors → `bugs/003-*/screenshot.png`
- Bug #004: Badge invisible dark mode → `bugs/004-*/screenshot.png`
- Bug #005: About CTA heading invisible → `bugs/005-*/screenshot.png`
- Bug #006: About stats low contrast → `bugs/006-*/screenshot.png`
- Bug #013: RevOps flywheel arrows → `bugs/013-*/screenshot.png`
- Bug #014: Footer links broken → `bugs/014-*/screenshot.png`
- Bug #015: Engagement icons inconsistent → `bugs/015-*/screenshot.png`
- Bug #019: RevOps 404 → `bugs/019-*/screenshot.png`
- Bug #023: Problem section hierarchy → `bugs/023-*/screenshot.png`
