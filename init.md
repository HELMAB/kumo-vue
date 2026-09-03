I'm building an open-source Vue 3 component library that brings Cloudflare
Kumo's design system to the Vue ecosystem. Kumo (https://github.com/cloudflare/kumo)
is React-only, built on Base UI. This project is the Vue counterpart, built
on Reka UI.

This session covers phase one only: the design token package. Don't build
components yet.

## Project shape
- Monorepo, pnpm workspaces, TypeScript, Vite.
- `packages/tokens` — design tokens (this phase).
- `packages/ui` — Vue components on Reka UI (later phases).
- `docs/` — documentation site (later).
- Target consumers: any Vue 3 or Nuxt 3 app. Framework-agnostic within Vue,
  no assumptions about the host app's build setup beyond Vite compatibility.

## Before you write anything
Read Kumo's token layer and tell me what naming conventions it uses —
its semantic color roles, spacing scale, and radius scale. I want our
public API to feel familiar to anyone who has used Kumo, so start from
theirs rather than inventing a parallel vocabulary. Show me the proposed
semantic token list and wait for my confirmation before writing files.

## What to build
A package at `packages/tokens` exporting:
1. A CSS file of custom properties, importable as `@scope/tokens/styles`.
2. A TypeScript module exporting the same values as typed objects, for
   cases where tokens are needed in JS — chart colors, canvas, inline styles.
3. Type definitions so token names autocomplete.

## Token architecture
Two tiers:
- Primitive tokens: raw scale values (`--color-blue-500`, `--space-4`).
  Internal; not part of the public API.
- Semantic tokens: role-based aliases pointing at primitives
  (`--surface-1`, `--text-secondary`, `--border-strong`, `--text-danger`).
  These are what consumers use.

Every semantic token must resolve in both light and dark mode. Use a
`[data-theme="dark"]` attribute selector with a `prefers-color-scheme`
media query fallback for when no explicit theme is set.

## Internationalization
The library targets a global audience, so bake this in from the start
rather than retrofitting:
- Logical CSS properties throughout (`margin-inline-start`, not
  `margin-left`) so RTL works without a separate stylesheet.
- A line-height scale generous enough for scripts with tall ascenders
  and stacked diacritics, not tuned solely to Latin.
- Font-family stacks as tokens, with a documented override path so
  consumers can supply script-specific fonts.
- No hardcoded text direction anywhere.

## Attribution
Token naming conventions are adapted from Cloudflare Kumo (MIT). Set up:
- `/NOTICE` at the repo root crediting Cloudflare, Inc.
- `/LICENSES/kumo-MIT.txt` as a placeholder; I'll paste the real text.
- A one-line header comment on any file with derived content.
- A credit line in the README.

## Constraints
- No Tailwind. Plain CSS custom properties.
- Zero runtime dependencies in this package.
- Every color pair must meet WCAG AA contrast in both modes. Flag any
  that don't rather than silently shipping them.