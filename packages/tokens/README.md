# `@kumo-vue/tokens`

Design tokens for Kumo Vue: semantic colour, spacing, radius and type scales,
shipped as CSS custom properties and as plain JavaScript values.

Token naming is adapted from [Cloudflare Kumo][kumo] (MIT). If you have used
Kumo in React, the vocabulary here should already be familiar.

[kumo]: https://github.com/cloudflare/kumo

## Install

```sh
pnpm add @kumo-vue/tokens
```

## Use

Import the stylesheet once, at your app's entry point:

```js
import "@kumo-vue/tokens/styles";
```

Then reference tokens as custom properties:

```css
.card {
  background: var(--kv-surface-elevated);
  color: var(--kv-text-default);
  border: 1px solid var(--kv-hairline);
  border-radius: var(--kv-radius-lg);
  padding: var(--kv-space-4);
  font-family: var(--kv-font-sans);
  line-height: var(--kv-leading-relaxed);
}
```

For values JavaScript needs to see — chart series, canvas fills, generated
images — import them:

```js
import { getColors, color } from "@kumo-vue/tokens";

const c = getColors("dark", { format: "hex" });
ctx.fillStyle = c.danger;

color.surfaceBase; // { light: "oklch(100% 0 0)", dark: "oklch(17% 0 0)" }
```

`readColor("surfaceBase")` reads the live computed value from the document
instead, if you need whatever the cascade currently resolves to.

## Theming

Light is the default. Dark applies automatically under
`prefers-color-scheme: dark`, and can be forced either way with `data-theme`:

```html
<html data-theme="dark">
<!-- or data-theme="light" to pin light mode against a dark OS setting -->
```

The attribute is not anchored to `:root`, so a subtree can opt into the
opposite mode:

```html
<body>
  <aside data-theme="dark">…</aside>
</body>
```

### Overriding tokens

Token declarations sit inside a `@layer kumo-vue.tokens` cascade layer.
Unlayered CSS always beats layered CSS, so a plain override wins in both modes
without `!important` and without matching our selector specificity:

```css
@import "@kumo-vue/tokens/styles";

:root {
  --kv-brand: oklch(62% 0.19 145);
  --kv-brand-hover: oklch(56% 0.18 147);
}
```

## Token reference

### Two tiers

**Primitive tokens** (`--kv-color-neutral-500`, `--kv-color-blue-700`) are raw
scale values with no meaning attached. They are emitted because semantic
tokens reference them, but they are **internal** — not covered by semver, and
liable to be retuned or removed in any release.

**Semantic tokens** are the public API. Every one resolves in both modes.

### Colour

| Group | Tokens |
| --- | --- |
| Text | `--kv-text-default` `-strong` `-subtle` `-placeholder` `-inactive` `-inverse` `-brand` `-link` `-info` `-success` `-warning` `-danger` |
| Surface | `--kv-surface-canvas` `-base` `-elevated` `-recessed` `-tint` `-contrast` `-overlay` `-control` |
| Interaction | `--kv-fill` `--kv-fill-hover` `--kv-interact` `--kv-brand` `--kv-brand-hover` `--kv-danger-fill` `--kv-focus` |
| Border | `--kv-line` `--kv-hairline` `--kv-line-strong` |
| Status | `--kv-info` `--kv-success` `--kv-warning` `--kv-danger`, each with a `-tint` companion |
| Shadow | `--kv-shadow-edge` `--kv-shadow-drop` `--kv-shadow-elevated` |
| Badge | `--kv-badge-{red,green,orange,purple,teal,blue,neutral,inverted}` plus `-inverted-text`, `-teal-subtle-text`, `-orange-subtle-text`, `-neutral-subtle-text` |

`--kv-line` and `--kv-hairline` are decorative separators. Anything that
delimits an actual control — an input border, a checkbox outline — needs
`--kv-line-strong`, which is the one that meets 3:1 against the surfaces.

### Dimension and type

- **Space** — `--kv-space-0` through `--kv-space-20` on a 0.25rem base, with
  half-steps at the low end. Decimal steps use a hyphen: `--kv-space-1-5`.
- **Radius** — `--kv-radius-none` `-sm` `-md` `-lg` `-xl` `-full`.
- **Type size** — `--kv-text-xs` (12px) `-sm` (13px) `-base` (14px) `-lg` (16px)
  `-xl` (20px) `-2xl` (24px) `-3xl` (30px). The three largest are the heading
  steps; the body scale stops at `lg`.
- **Line height** — `--kv-leading-tight` (1.4) `-normal` (1.5) `-relaxed` (1.7)
  `-loose` (1.9).
- **Font** — `--kv-font-sans` `--kv-font-mono`.

## Sizing scales with your root font size

Every dimension token is in `rem`, so a `base` control is `2.25rem` — 36px at
the usual 16px root, 41px at an 18px one. That is deliberate: it respects a
reader who has raised their browser's default text size, and it is what Kumo
does too (`h-9` is `2.25rem` there as well).

The practical consequence is that comparing a component against
[kumo-ui.com][kumo] only works at a matching root size — that site runs at
16px. If your components look uniformly 12.5% too large or too small, check
`:root { font-size }` before suspecting the component.

To pin component sizing regardless of the page's text size, set the root back
to 16px on a wrapper, or override the affected tokens in `px`.

## Internationalization

**Logical properties.** The stylesheet contains no directional properties at
all — no `left`, `right`, `margin-left` — so RTL needs no second stylesheet.
A test asserts this. Components built on these tokens should follow the same
rule: `margin-inline-start` over `margin-left`, `inset-inline-end` over
`right`, `padding-block` over `padding-top`/`-bottom`. Nothing in this package
hardcodes a text direction; set `dir` on your document and it propagates.

**Line heights.** Kumo's scale is tight — its `sm` line height works out to
about 1.18, roughly 15px of leading on 13px text. That is comfortable for
Latin and clips Khmer stacked subscripts, Thai upper and lower vowel marks,
and Devanagari matras, all of which extend past the Latin ascender and
descender bounds. This package floors line height at 1.4 and defaults body
copy to `--kv-leading-relaxed` (1.7). Use `--kv-leading-tight` only for
single-line, Latin-only content such as button labels.

**Fonts.** `--kv-font-sans` lists Noto faces as fallbacks after the platform UI
font. They are not requirements — every current OS ships coverage for the major
scripts — but a system that has Noto installed will pick a face designed to sit
alongside the Latin one.

To supply script-specific fonts, override the token after importing:

```css
@import "@kumo-vue/tokens/styles";

:root {
  --kv-font-sans: "Inter", "Noto Sans Khmer", system-ui, sans-serif;
}

/* Or per-language, which is usually what you want for mixed content: */
:lang(km) {
  --kv-font-sans: "Noto Sans Khmer", system-ui, sans-serif;
  --kv-leading-normal: 1.7; /* Khmer benefits from extra leading */
}
```

## Contrast

`pnpm contrast` audits every declared foreground/background pair in both
modes. Translucent tints are composited over their backdrop first, so what is
measured is what renders. Body text is held to 4.5:1 (WCAG AA 1.4.3), large
text and non-text boundaries to 3:1 (1.4.11).

**The build fails if a non-exempt pair regresses.** Two categories are exempt
and reported rather than enforced:

- `--kv-text-inactive` — disabled text, exempt under 1.4.3.
- `--kv-line` and `--kv-hairline` — decorative separators, not boundaries
  "required to identify" a control. Use `--kv-line-strong` where 1.4.11 applies.

## Where this diverges from Kumo

Four deliberate departures:

1. **Line heights are our own**, for the reason above. Kumo's font *sizes* are
   carried over unchanged.
2. **The brand colour is a neutral placeholder.** Kumo's brand tokens are
   Cloudflare's. A naming convention can be adapted under MIT; a company's
   brand colour is a trade mark, not a token. Override `--kv-brand`.
3. **Some values were darkened to meet AA:** `--kv-text-subtle` in light mode,
   and `--kv-warning`, which at Kumo's value measures 2.43:1 on white.

   The filled-button colours are the exception — `--kv-brand` and
   `--kv-danger-fill` are Kumo's exact values, which put a white label below
   AA. That is a deliberate parity choice, reported by the button's own audit
   and reversible with two overrides; see
   [the accessibility note](../ui/README.md#accessibility-the-filled-variants).
4. **Banner tokens are omitted.** Kumo carries `banner-info` and
   `banner-warning`. The Banner component reuses the status tints instead,
   which is what those tokens duplicate.

   The badge palette *is* here, having been left out of the first cut of this
   package as "component specific". That was the wrong call: a badge colour has
   to resolve in both modes, and the alternatives were hardcoding theme
   selectors inside a component file or pointing copied components at internal
   primitives. Both are worse than naming them.

Two tokens are additions with no Kumo counterpart. `--kv-line-strong` exists
because none of Kumo's border tokens reach 3:1. `--kv-danger-fill` splits the
destructive fill from the status red, which Kumo serves with one token, so the
fill can be retargeted for contrast without moving the status colour with it.

`--kv-shadow-drop` and `--kv-shadow-elevated` split what Kumo gets from
Tailwind's `shadow-xs` and `shadow-lg` — 5% and 10% black. One token cannot
serve a resting 1px shadow and a floating popup without one of them being
wrong.

`--kv-text-brand` and `--kv-brand` also hold different values in both modes:
brand-as-text sits on a light surface and brand-as-fill carries a white label,
and one value cannot satisfy both.

## Development

```sh
pnpm build      # regenerate dist/ from src/tokens.config.js
pnpm contrast   # print the WCAG audit
pnpm test       # smoke tests over the generated output
```

`src/tokens.config.js` is the single source of truth. The CSS and the
JavaScript are both generated from it in one pass, so the two cannot disagree
and a light value cannot drift from its dark counterpart. Do not edit `dist/`.

## Licence

MIT. Token naming adapted from [Cloudflare Kumo][kumo] (MIT) — see
[`/NOTICE`](../../NOTICE).
