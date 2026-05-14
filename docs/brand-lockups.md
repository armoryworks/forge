# Forge — brand lockup system

This document covers the Forge wordmark/lockup SVGs that live alongside `armory-works-logo.svg` and `armory-works-wordmark*.svg` in `public/`. It describes which file to use where, the design tokens, the shield construction, and the questions deliberately deferred until Armory Works ships a second product.

---

## The lockup system

There are two Forge lockups, each in dark and light variants — four files total.

**Primary lockup** — `forge-wordmark.svg` / `forge-wordmark-light.svg`

The default. Used everywhere day-to-day: app header, browser tab area, sign-offs, email signature, social avatar, GitHub README, error pages. Shield + "Forge" + small "ARMORY WORKS" mono caps subline, mirroring how "TECHNOLOGY, LLC" sits under "Armory Works" in the parent wordmark. ViewBox 160×60 so it fits comfortably in nav chrome.

**Marquee lockup** — `forge-marquee.svg` / `forge-marquee-light.svg`

Used only at first-impression surfaces: login screen, splash, hero band on a marketing page, slide one of a deck. Shield + "Forge" + amber rule + "MES/MRP/ERP" tagline. ViewBox 170×75 — taller than primary to accommodate the larger shield + tagline.

The distinction matters because the tagline gets noisy if it rides along every time the wordmark appears. Once a user is inside the app, "MES/MRP/ERP" sitting under "Forge" in every header is bloat — they already know what Forge is, they're using it. If you find yourself reaching for marquee inside the app proper, you almost certainly want primary instead.

---

## When to use which

| Surface | File |
| --- | --- |
| App header / nav | `forge-wordmark.svg` |
| Login screen | `forge-marquee.svg` |
| Splash / loading screen | `forge-marquee.svg` |
| Sign-off, footer | `forge-wordmark.svg` |
| Email signature | `forge-wordmark.svg` |
| Social avatar (square) | `armory-works-logo.svg` (shield only) |
| Browser favicon | `armory-works-logo.svg` (shield only) |
| Marketing hero band | `forge-marquee.svg` |
| Slide one of a deck | `forge-marquee.svg` |
| Slide chrome (header/footer in deck) | `forge-wordmark.svg` |
| Error page | `forge-wordmark.svg` |
| GitHub repo README header | `forge-wordmark.svg` |

For light-on-dark surfaces use the base file; for dark-on-light surfaces use the `-light` variant. The variants differ only in text colors and drop-shadow tokens — the shield itself is amber in both, because the brand color shouldn't flip with theme.

---

## Design tokens

```
Amber (shield, rule)            #f59e0b
Slate-50 (Forge on dark)        #f1f5f9
Navy (Forge on light)           #0f172a
Amber-300 (subline on dark)     #fbbf24
Amber-700 (subline on light)    #b45309

Wordmark font                   Space Grotesk, weight 700
Tagline / subline font          IBM Plex Mono, weight 500

Drop shadow (dark)              dx 0, dy 1, blur 1.2, #000 @ 0.5
Drop shadow (light)             dx 0, dy 1, blur 1.2, #0f172a @ 0.22
```

These match the parent `armory-works-wordmark.svg` and `armory-works-wordmark-light.svg` exactly. If you ever change one set, change both.

---

## Shield construction

The shield is verbatim from `armory-works-logo.svg`. Heraldically it's a *per pale* split — the field divided vertically down the centerline, with the inner border and the W counterchanged across that line. Both the outer shield and the inner shield carry an amber stroke.

The same shield is used for both the parent firm mark (Armory Works) and the Forge lockup. This is an intentional family signature for now, with one consequence worth being explicit about: **the shield = Armory Works.** If Armory Works ever ships a second product, both products will want their own interior glyph paired under the same shield (e.g. Forge → anvil, second product → hammer) so that the shield reads as the family mark and the interior reads as the product. That's a future decision — don't relitigate it until there's a second product.

In the SVG, the shield mark is scaled to `0.1125` and positioned at `translate(2 3)` inside the wordmark viewBox. IDs are prefixed `f-*` so Forge lockups won't collide with the parent's `aw-*` IDs if both are inlined into the same document.

---

## Typography

The wordmark and subline are real `<text>` nodes, not vectorized paths. Two consequences:

1. The consumer must have Space Grotesk and IBM Plex Mono loaded. armoryworks.com already loads both, so this is a no-op there. In the Forge app, make sure the same fonts are in the global stylesheet.

2. If a host environment doesn't load those fonts, the text falls back through `Inter → system-ui → sans-serif` for the wordmark and `Consolas → Monaco → monospace` for the subline. The visual will degrade gracefully but won't match exactly.

If you want font-independence later — the same approach the parent wordmark uses — run the two text elements through a glyph-to-path converter (Inkscape's *Path → Object to Path*, or a `text-to-path` build step) and paste the resulting paths back in. The parent vectorized "Armory Works" and "TECHNOLOGY, LLC"; you can do the same for "Forge" and the sublines.

Both subline widths are locked via `textLength="<n>" lengthAdjust="spacingAndGlyphs"` so the visual width matches the amber rule exactly, regardless of which font actually renders.

---

## Anti-patterns

Things to **not** do with these lockups:

Don't squish "by Armory Works Technology, LLC" inline next to "Forge" the way the old login screen did. The legal entity name lives in footers and contracts, not in the visual lockup. The lockup attribution is "ARMORY WORKS" — full stop.

Don't reach for the marquee lockup inside the app. The tagline is a marketing element, not chrome.

Don't recolor the shield to match a theme. Amber stays amber. The wordmark text and the drop shadow flip with theme; the shield doesn't.

Don't render the lockups below their intrinsic size. Each SVG ships at the size it was designed for (wordmark 160×60, marquee 170×75); shrinking causes the textLength-locked subline to crowd. Scale up if needed, not down.

Don't use the `forge-lockup.svg` or `forge-lockup-anvil.svg` files from the earlier design pass — those used a hand-drawn shield and are superseded by these four. Delete them.

---

## Future decisions (logged, not solved)

**When Armory Works ships a second product**, revisit the shield-as-family-mark question. Likely outcome: Forge gets an interior glyph (anvil, hammer, flame) that replaces the W inside the shield for Forge-specific lockups; the W shield becomes the parent firm's mark only. Don't pre-build this — wait until there's a real second product.

**When Forge is recognized as a brand on its own** (post-launch, post-traction), the "ARMORY WORKS" subline on the primary lockup can be dropped in favor of just shield + "Forge." For now the attribution helps establish the family relationship and disambiguate from other products named Forge.

**If you decide to vectorize the typography**, do it once and keep the source `<text>` version in git so you can re-vectorize later if the typeface or wording changes.
