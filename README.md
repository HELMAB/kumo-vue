# Kumo Vue

[Cloudflare Kumo][kumo]'s design system, for Vue.

Kumo is React-only, built on [Base UI][baseui]. Kumo Vue is the Vue 3
counterpart, built on [Reka UI][reka]. It targets any Vue 3 or Nuxt 3 app and
assumes nothing about the host build setup beyond Vite compatibility.

[kumo]: https://github.com/cloudflare/kumo
[baseui]: https://base-ui.com
[reka]: https://reka-ui.com

## Quick start

```sh
npm install reka-ui @kumo-vue/tokens
npx kumo-vue@latest add button
```

Import the tokens once in your global stylesheet, and use the component:

```css
@import "@kumo-vue/tokens/styles";
```

```vue
<script setup>
import { Button } from "@/components/ui/button";
</script>

<template>
  <Button variant="primary">Save</Button>
</template>
```

Components are copied into your repository rather than imported from a
package — you own the files from there.

## Status

Early. Tokens and the first component exist.

| Package | Status |
| --- | --- |
| [`packages/tokens`](packages/tokens) | Design tokens — available on npm as `@kumo-vue/tokens` |
| [`packages/ui`](packages/ui) | Vue components on Reka UI — `Autocomplete`, `Badge`, `Banner`, `Breadcrumbs`, `Button`, `Checkbox`, `Select`, `Tabs`, `Text`, `Toast` |
| [`packages/cli`](packages/cli) | `npx kumo-vue add` — available on npm as `kumo-vue` |
| `docs/` | Documentation site — not started |

## Development

```sh
pnpm install
pnpm build      # tokens, then the CLI registry
pnpm test       # every package
pnpm contrast   # WCAG audit across tokens and components
```

Requires Node 18 or newer and pnpm 9.

`packages/ui` is the source of truth for components. `packages/cli/registry/`
is generated from it, so after changing a component run
`pnpm --filter kumo-vue build` to regenerate what `add` ships.

## Design principles

**Tokens are two-tiered.** Primitives are raw scale values and stay internal.
Semantic tokens name roles — `--kv-surface-elevated`, `--kv-text-subtle` — and
are the only thing consumers build against.

**Internationalization is not a later phase.** Logical CSS properties
throughout, so RTL works without a mirrored stylesheet. A line-height scale
floored at 1.4, chosen for scripts with tall ascenders and stacked diacritics
rather than tuned to Latin alone. Font stacks as overridable tokens. No
hardcoded text direction anywhere.

**Contrast is enforced, not aspirational.** Every colour pair is audited
against WCAG AA in both modes, and the build fails if a non-exempt pair
regresses. Components audit the colours they mix at render time too — Kumo's
own emphasis gradient leaves a white label at 2.68:1, which is the kind of
thing that only shows up if something checks. Where a pair is legitimately
exempt — disabled text, decorative rules — it is reported rather than hidden.

**No Tailwind.** Kumo is built on Tailwind v4's `@theme`. Kumo Vue ships plain
CSS custom properties, so it drops into any Vue app regardless of its CSS
setup. The token package has zero runtime dependencies.

## Credit

Design token naming conventions and component designs are adapted from
[Cloudflare Kumo][kumo], MIT licensed, copyright Cloudflare, Inc. Kumo is React
and Tailwind; this is Vue and plain CSS, so no Kumo source file is copied
verbatim — what carries over is the design. See [`NOTICE`](NOTICE) for exactly
what is derived, and the per-package READMEs for where this project
deliberately departs: [tokens](packages/tokens/README.md#where-this-diverges-from-kumo),
[components](packages/ui/README.md#where-the-port-diverges-from-kumo).

Kumo Vue is not affiliated with or endorsed by Cloudflare, Inc.

## Licence

MIT — see [`LICENSE`](LICENSE).
