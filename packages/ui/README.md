# `@kumo-vue/ui`

Vue 3 components for Kumo Vue, built on [Reka UI][reka] and the
[`@kumo-vue/tokens`](../tokens) custom properties.

This package is **not published to npm**. It is the source of truth that the
[`kumo-vue` CLI](../cli) copies from — you get the component files in your own
repository and own them from there, the way shadcn-vue works. Developing and
testing happen here; `packages/cli/registry/` is a generated snapshot.

[reka]: https://reka-ui.com

## Install a component

```sh
npx kumo-vue@latest add button
```

## Components

| Component | Status |
| --- | --- |
| `Autocomplete` | Available |
| `Badge` | Available |
| `Banner` | Available |
| `Button` | Available |

## Autocomplete

A free-form text input with a filtered suggestion list. Free-form is the
distinction from a combobox: the value is whatever is typed, and the
suggestions are a convenience.

```vue
<Autocomplete v-model="fruit" :items="fruits" label="Fruit" placeholder="Search…" />

<Autocomplete v-model="q" :items="products">
  <template #item="{ item }">{{ item.label }} — {{ item.region }}</template>
</Autocomplete>
```

| Prop | Type | Default |
| --- | --- | --- |
| `modelValue` | `string` | — |
| `items` | `string[]` · `{ label, value, disabled }[]` · `{ label, items }[]` | `[]` |
| `size` | `xs` `sm` `base` `lg` | `base` |
| `placeholder` | `string` | — |
| `label` `description` `error` | `string` | `""` |
| `required` `disabled` | `boolean` | `false` |
| `emptyMessage` | `string` | `"No results found"` |
| `ignoreFilter` | `boolean` | `false` |
| `openOnFocus` | `boolean` | `false` |
| `open` | `boolean` | — |

Slots: `item` (scoped, receives `item` and the normalised `option`), `empty`.
Emits `update:modelValue` and `update:open`.

Built on **Reka UI's `Autocomplete` primitive** — the direct counterpart to the
Base UI one Kumo uses. Reka owns the filtering, keyboard navigation, focus
management and ARIA wiring, so the rendered input carries the same
`role="combobox"` / `aria-autocomplete="list"` / `aria-activedescendant`
contract Kumo's does.

**Grouping is a shape, not a set of components.** Pass `{ label, items }`
entries and headings and separators are rendered for you. Mixing groups with
loose items drops the loose ones — they have nowhere to sit once headings
exist.

**Item normalisation lives in `items.js`** next to the component, so it can be
tested directly and swapped for your own API's shape without touching the
template.

**Sizes are in `rem`**, so a `base` field is 36px at a 16px root and 41px at
18px — the same scaling Kumo has. See
[the tokens README](../tokens/README.md#sizing-scales-with-your-root-font-size).

**Set `ignoreFilter`** when you filter yourself — a server query, say — and
`items` is rendered exactly as given.

## Badge

```vue
<Badge variant="green">Active</Badge>
<Badge variant="success" appearance="dot">Healthy</Badge>
<Badge variant="secondary"><template #icon><StarIcon /></template>Starred</Badge>
```

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | semantic: `primary` `secondary` `error` `warning` `success` `info` `outline` `beta` · palette: `red` `green` `orange` `purple` `teal` `blue` `neutral` `inverted` `teal-subtle` `neutral-subtle` | `primary` |
| `appearance` | `filled` `dot` | `filled` |
| `as` / `asChild` | as on Button | `span` / `false` |

Slots: default for the label, `icon` for a leading icon. `destructive` is
accepted as a deprecated alias for `red`, as in Kumo.

In `dot` mode the variant's fill is replaced by an outline plus a status dot,
and the icon slot is ignored — Kumo's types forbid the combination, and this
enforces the same thing at runtime. Only `success`, `warning`, `error` and
`neutral` carry a dot colour; other variants render the outline with no dot.

**`teal-subtle` works here and does not upstream.** Kumo's variant asks for a
`--color-kumo-badge-teal-subtle` background that its theme never defines, so
the badge renders with no fill. This port supplies an 18% tint of the badge
teal.

## Banner

```vue
<Banner title="Update available" description="A new version is ready." />

<Banner variant="error" size="sm" title="Save failed" live>
  <template #icon><WarningIcon /></template>
  <template #action><Button size="xs">Retry</Button></template>
</Banner>
```

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `default` `alert` `error` `secondary` | `default` |
| `size` | `base` `sm` | `base` |
| `title` | `string` | `""` |
| `description` | `string` | `""` |
| `live` | `boolean` | `false` |

Slots: `icon`, `action`, and a default slot for unstructured content.

`title` and `description` are props rather than slots because Kumo intends them
to take translated strings directly. A `sm` banner keeps them on one line for
dialogs and other tight spaces.

**`live` is an addition.** Kumo's banner is a plain `div`, which means a banner
that appears in response to a user action is never announced. Setting `live`
adds `role="status"` / `aria-live="polite"`, or `role="alert"` /
`aria-live="assertive"` for the error variant. It is off by default so a banner
rendered with the page does not announce itself out of context.

**Autocomplete is one component, not a compound.** Kumo exposes
`Autocomplete.InputGroup`, `.Content`, `.List`, `.Item`, `.Group`,
`.GroupLabel` and `.Separator`, assembled with a render prop. That is a React
idiom; in Vue the same flexibility comes from props and a scoped slot, and it
keeps the copied component to three readable files instead of eight. Every
example in Kumo's docs — basic, controlled, field, error, grouped, sizes,
filtering — has a direct equivalent here.

**Autocomplete has no `Field` wrapper.** Kumo composes a separate `Field`
component for the label, description and error. Those are props here, wired to
`aria-describedby` and `aria-invalid` directly.

**No `Banner.Action` compound.** Kumo ships an accent-aware CTA that reads the
banner variant through React context. Here the `action` slot takes any element,
so a `Button` goes straight in.

## Button

Ported from [Cloudflare Kumo's][kumo] React Button. Variant, size and shape
names match Kumo's.

[kumo]: https://github.com/cloudflare/kumo/tree/main/packages/kumo/src/components/button

```vue
<script setup>
import { Button } from "@/components/ui/button";
</script>

<template>
  <Button variant="primary" @click="save">Save</Button>
  <Button variant="destructive" :loading="deleting">Delete</Button>

  <Button shape="square" aria-label="Add">
    <template #icon><PlusIcon /></template>
  </Button>

  <Button as="a" href="/docs" variant="ghost">Docs</Button>
  <Button as-child><RouterLink to="/settings">Settings</RouterLink></Button>
</template>
```

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `primary` `secondary` `ghost` `destructive` `secondary-destructive` `outline` | `secondary` | |
| `size` | `xs` `sm` `base` `lg` | `base` | |
| `shape` | `base` `square` `circle` | `base` | `square` and `circle` are icon-only |
| `loading` | `boolean` | `false` | Swaps the icon for a spinner and blocks interaction |
| `disabled` | `boolean` | `false` | |
| `as` | `string \| object` | `"button"` | Render as another element, e.g. `"a"` |
| `asChild` | `boolean` | `false` | Style the single child instead of rendering an element |
| `external` | `boolean` | `false` | On `as="a"`, adds `target="_blank"` and a safe `rel` |

### Slots

| Slot | Notes |
| --- | --- |
| default | The label |
| `icon` | Rendered before the label, sized to `1em`. Replaced by the spinner while loading |

Icons come through the slot rather than a prop, so no icon library is a
dependency. Anything that renders an `<svg>` works; it inherits `currentColor`.

### Behaviour worth knowing

**A disabled link becomes a button.** `as="a"` with `disabled` renders a real
`<button disabled>` and drops `href`, `target` and the other anchor-only
attributes. A disabled anchor is still focusable and still navigable, so
styling one as disabled would be a lie. Kumo makes the same swap.

**A loading link is inert.** Anchors have no `disabled`, so a loading one gets
`aria-disabled="true"`, has its listeners stripped, and has navigation
prevented.

**Icon-only buttons must have an accessible name.** Kumo enforces this through
its TypeScript prop types. This port is JavaScript, so the equivalent is a
development-only `console.warn` when `shape="square"` or `"circle"` has no
label, `aria-label`, `aria-labelledby` or `title`. It costs nothing in a
production build.

## Accessibility: where Kumo's colours fall short of AA

This port matches Kumo's colours, and several of them are below WCAG AA.
Measured from Kumo's own site:

| | ratio | AA wants |
| --- | --- | --- |
| Button primary — white label on gradient | 3.46:1 | 4.5:1 |
| Button primary — on hover | 2.68:1 | 4.5:1 |
| Button destructive — white label | 3.05:1 | 4.5:1 |
| Button destructive — on hover | 2.48:1 | 4.5:1 |
| Badge green — white label | 3.67:1 | 4.5:1 |
| Warning text on its tint (badge, banner) | 4.01:1 | 4.5:1 |
| Warning as a status fill | 2.43:1 | 3:1 |

`pnpm contrast`, in this package and in `tokens`, prints every one of these
each run marked `BELOW … accepted by design`. They do not fail the build,
because matching Kumo is the point of the port — but they are never silent, and
a genuine regression in anything else still fails.

To restore AA, override the tokens in your own CSS. Hue and chroma stay
Kumo's; only lightness moves:

```css
:root {
  --kv-brand: oklch(49% 0.22 260);
  --kv-danger-fill: oklch(50% 0.215 27.5);
  --kv-badge-green: oklch(50.8% 0.118 165.612);
  --kv-text-warning: oklch(47% 0.113 57);
  --kv-warning: oklch(64.5% 0.168 50);
}

[data-theme="dark"] {
  --kv-brand: oklch(50% 0.22 258);
  --kv-danger-fill: oklch(52% 0.215 27.5);
}
```

The button's hover still lightens, which cannot pass at any lightness — swap
its `:hover::before` gradient to darken if you need that too.

## Where the port diverges from Kumo

**Layout.** Kumo's base is `flex w-max`, which makes each button a block that
shrinks to content — two adjacent buttons stack vertically. This uses
`inline-flex`, which behaves identically inside a flex container and correctly
inline everywhere else.

**Hover on a dark surface.** Kumo darkens `--kv-brand-hover` to blue-700 in
both modes, which on a dark background makes the hover state *less* visible
than the resting fill (2.80:1). Dark mode lightens instead. The button itself
does not read that token — it mixes hover from the fill exactly as Kumo does —
so this only affects code using `--kv-brand-hover` directly.

**`xs` icon-only buttons are 20px, not 14px.** Kumo's `compactSize.xs` is
`size-3.5` (14px) while its `size.xs` height is `h-5` (20px). A 14px target is
below any reasonable minimum and inconsistent with the row height, so the
compact shapes track the button height at every size.

**No tooltip.** Kumo wraps a button in its `Tooltip` when `title` is set. There
is no Tooltip component here yet, so `title` is passed through as the native
attribute. This will change when Tooltip lands.

**No `RefreshButton`.** Kumo ships a preset that is `shape="square"` plus a
spinning icon. That is three lines in userland and does not need to be a
component.

## Development

```sh
pnpm test       # component behaviour, via vitest + jsdom
pnpm contrast   # WCAG audit of the emphasis gradients
```

After changing a component, regenerate the CLI registry so `add` ships the
change:

```sh
pnpm --filter kumo-vue build
```

## Licence

MIT. Ported from [Cloudflare Kumo][kumo-repo] (MIT) — see [`/NOTICE`](../../NOTICE).

[kumo-repo]: https://github.com/cloudflare/kumo
