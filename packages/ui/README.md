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
| `Breadcrumbs` | Available |
| `Button` | Available |
| `Checkbox` · `CheckboxGroup` | Available |
| `Tabs` | Available |
| `Text` | Available |
| `Toaster` · `toast` | Available |
| `Select` | Available |

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

**Select options carry no focus ring.** Kumo's option has a `focus-visible`
ring, which upstream almost never appears: Base UI leaves focus on the popup
and points at the active option with `aria-activedescendant`. Reka moves real
DOM focus onto the option, so the same rule would draw a ring on every mouse
click — something Kumo never shows. The `data-highlighted` tint is the
affordance in both.

**Autocomplete is one component, not a compound.** Kumo exposes
`Autocomplete.InputGroup`, `.Content`, `.List`, `.Item`, `.Group`,
`.GroupLabel` and `.Separator`, assembled with a render prop. That is a React
idiom; in Vue the same flexibility comes from props and a scoped slot, and it
keeps the copied component to three readable files instead of eight. Every
example in Kumo's docs — basic, controlled, field, error, grouped, sizes,
filtering — has a direct equivalent here.

**Select is one component too**, for the same reason, replacing
`Select.Option`, `.Group`, `.GroupLabel` and `.Separator`.

**Neither Select nor Autocomplete has a `Field` wrapper.** Kumo composes a separate `Field`
component for the label, description and error. Those are props here, wired to
`aria-describedby` and `aria-invalid` directly.

**No `Banner.Action` compound.** Kumo ships an accent-aware CTA that reads the
banner variant through React context. Here the `action` slot takes any element,
so a `Button` goes straight in.

## Breadcrumbs

The trail showing where the current page sits in a hierarchy.

```vue
<Breadcrumbs :items="[
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Breadcrumbs' },
]" />

<Breadcrumbs :items="trail" :link-as="RouterLink" clipboard="https://dash.example.com/here" loading>
  <template #icon="{ index }"><HomeIcon v-if="index === 0" /></template>
</Breadcrumbs>
```

| Prop | Type | Default |
| --- | --- | --- |
| `items` | `string[]` · `{ label, href, icon, current }[]` | `[]` |
| `size` | `sm` `base` | `base` |
| `loading` | `boolean` | `false` |
| `clipboard` | `string` | `""` |
| `linkAs` | `string \| object` | `"a"` |
| `label` | `string` | `"Breadcrumb"` |
| `copyLabel` `copiedLabel` | `string` | `"Copy link"` · `"Copied"` |

Slots: `item` and `icon` (both scoped, receiving `item`, `crumb` and `index`),
`separator`. Emits `copy` with the text once it is on the clipboard.

**A trail is a list.** Kumo renders a flat run of `div`s inside the `nav`; this
renders `nav > ol > li`, so a screen reader announces how many crumbs there are
and where in them you are. The current crumb still carries `aria-current="page"`.

**The last crumb is the current page** unless one sets `current: true`. It is
the only crumb allowed to truncate — letting every crumb shrink proportionally
turns the trail into unreadable stubs (`Com… › Anal… › Acco…`), which is Kumo's
reasoning too. A current crumb with an `href` renders as text, not a link: you
are already there.

**Collapsing is CSS, not JavaScript.** Below 640px Kumo keeps the last two
crumbs and an ellipsis, and gets there by rebuilding the child list in React.
Here the whole trail is rendered once and the middle is hidden by a media
query, so the markup does not change with the viewport and nothing re-runs on
resize. The ellipsis is only in the DOM when there is something for it to
stand in for.

**Router links get `to`, anchors get `href`.** Kumo hands its link component
both and lets it choose, which quietly leaves a stale `href` on a router link.
Set `linkAs` to `RouterLink`, `NuxtLink` or your own component and each crumb's
`href` is passed as `to`; the default `a` gets `href`.

**The copy button appears on focus, not only on hover.** Kumo fades it in on
`group-hover` alone, so anyone tabbing to it moves focus to something invisible.
It is revealed on keyboard focus here as well, and stays up for the two seconds
it spends confirming a copy. It is a ghost `Button`, so `add breadcrumbs`
brings Button with it.

**Its strings are props.** Kumo hardcodes `aria-label="breadcrumb"`, `"Copy"`
and `"Click to copy"`. `label`, `copyLabel` and `copiedLabel` take translated
text, which a library that ships logical properties for RTL should not be
leaving in English.

**Links underline on hover.** Kumo's crumbs are static, which gives no
indication that they are clickable before you click one.

## Checkbox

A control toggled between checked, unchecked and indeterminate, with its label
built in.

```vue
<Checkbox v-model="agreed" label="Accept terms and conditions" />
<Checkbox v-model="remember" label="Remember me" :control-first="false" />
<Checkbox label="Invalid option" error />

<CheckboxGroup
  v-model="prefs"
  :items="options"
  legend="Email preferences"
  description="Choose how you'd like to receive updates"
/>
```

### Checkbox

| Prop | Type | Default |
| --- | --- | --- |
| `modelValue` | `boolean` · `"indeterminate"` | — |
| `indeterminate` | `boolean` | `false` |
| `label` | `string` | `""` |
| `error` | `boolean` · `string` | `false` |
| `description` | `string` | `""` |
| `controlFirst` | `boolean` | `true` |
| `disabled` | `boolean` | `false` |
| `required` | `true` · `false` · unset | unset |
| `name` `value` `id` | `string` | — · `"on"` · generated |

Slot: `label`. Emits `update:modelValue`.

### CheckboxGroup

| Prop | Type | Default |
| --- | --- | --- |
| `modelValue` | `unknown[]` | `[]` |
| `items` | `string[]` · `{ label, value, disabled }[]` | `[]` |
| `legend` | `string` | `""` |
| `legendHidden` | `boolean` | `false` |
| `description` `error` | `string` | `""` |
| `disabled` | `boolean` | `false` |
| `controlFirst` | `boolean` | `true` |
| `name` | `string` | — |

Slots: `legend`, `item` (scoped, receiving `item`, `option` and `index`).
Emits `update:modelValue`.

Built on **Reka UI's Checkbox and CheckboxGroup primitives** — the counterparts
to the Base UI ones Kumo uses. Reka owns the `role="checkbox"` /
`aria-checked="mixed"` contract, space-to-toggle, and the hidden input that
makes the control submit with a form.

**The group takes `items`, not `Checkbox.Item` children.** Same reasoning as
Select and Autocomplete, and the same `{ label, value, disabled }` shape,
normalised by the same `items.js` helper. `Checkbox.Legend` becomes the
`legend` prop, the `legend` slot, and `legendHidden` for Kumo's `sr-only`
example — this port has no utility class layer to reach for.

**`error` is one prop, not a variant plus a message.** Kumo has
`variant="error"` on a checkbox for the red ring and makes you wrap it in a
group to get any text; here `:error="true"` is that ring and `error="..."`
draws it *and* renders the message. A group's `error` propagates the ring to
every box in it, so the per-item `variant="error"` Kumo's own example repeats
by hand is not needed.

**Indeterminate stays a separate prop**, as in Kumo: clicking a mixed box
checks it and leaves clearing the flag to you. Reka carries the mixed state
inside the value instead, so `v-model="'indeterminate'"` also works if you
prefer that.

**Tab reaches every box in a group.** Reka's `CheckboxGroupRoot` defaults to
roving focus — one tab stop, arrow keys between boxes — which is radio-group
behaviour, not checkbox behaviour, and contradicts what Kumo's own
documentation promises. It is switched off.

**The group's messages are wired up.** Kumo renders the error and description
as bare `<p>`s that nothing points at; here the fieldset carries
`aria-describedby`, and an error also sets `aria-invalid` on each box. Kumo
renders both its error and its description at once even though its docs say the
error replaces the description — this follows the documented behaviour, and
Select's.

**A missing accessible name warns in development**, the same runtime stand-in
for Kumo's TypeScript prop types that Button uses for icon-only buttons.

**There is no `allValues` select-all.** Base UI's group takes it; Reka's does
not, and in Vue the parent box is four lines of `computed` in userland —
`:model-value="allChecked"`, `:indeterminate="someChecked"` and an
`@update:model-value` that sets the array. The demo app shows it.

**No `labelTooltip`.** There is no Tooltip component here yet, as with Button's
`title`. This will change when Tooltip lands.

## Tabs

A bar of tabs, in the segmented or underline style, with an indicator that
slides to the selected one.

```vue
<Tabs v-model="tab" :items="['Overview', 'Analytics', 'Settings']" label="Sections" />

<Tabs v-model="tab" :items="tabs" variant="underline" size="sm" />

<Tabs v-model="tab" :items="[{ label: 'Docs', value: 'docs', href: '/docs' }]" :link-as="RouterLink" />
```

| Prop | Type | Default |
| --- | --- | --- |
| `modelValue` | `string` · `number` | — |
| `defaultValue` | `string` · `number` | — |
| `items` | `string[]` · `{ label, value, disabled, href }[]` | `[]` |
| `variant` | `segmented` `underline` | `segmented` |
| `size` | `base` `sm` | `base` |
| `activateOnFocus` | `boolean` | `false` |
| `linkAs` | `string \| object` | `"a"` |
| `dir` | `ltr` · `rtl` · unset | unset |
| `label` | `string` | — |
| `scrollStartLabel` `scrollEndLabel` | `string` | `"Scroll tabs to the start"` · `"…to the end"` |

Slot: `tab` (scoped, receiving `item`, `option` and `index`). Emits
`update:modelValue`.

Built on **Reka UI's Tabs primitive**, the counterpart to the Base UI one Kumo
uses. Reka owns the `role="tablist"` / `role="tab"` contract, arrow-key
navigation, and the measurements the indicator slides between.

**The bar renders no panels**, as Kumo's does not: a tab selects a value and
the page decides what that means. Reka points a tab at a panel only when one
exists, so nothing is left with a dangling `aria-controls`.

**`items`, not `tabs`.** The only renamed prop — every component here that
takes a list takes `items`, normalised by the same `items.js` helper, so plain
strings work too. Kumo's `selectedValue` is `defaultValue`, and
`value` / `onValueChange` are `v-model`.

**Link tabs are `href`, not a render prop.** Kumo passes a `render` function to
turn a tab into a link; here an item with an `href` renders as one, through
`linkAs` — `RouterLink` and `NuxtLink` get `to`, a plain `a` gets `href`, the
same contract as Breadcrumbs.

**Overflow controls appear for both variants.** Kumo renders them for
`segmented` only, though its own control carries styling for the other; an
underline bar overflows just the same. Press one and the list moves by whole
tabs, so nothing is left half-shown.

**RTL works without configuration**, which took two fixes upstream does not
have. Reka *asks* for a writing direction and defaults to `ltr`, then writes
that onto the element — overriding an `rtl` inherited from the page and
flipping the whole bar back. The inherited direction is read from the nearest
`dir` instead, and `dir` is a prop when you want to say so explicitly. And the
scroll controls compare `Math.abs(scrollLeft)`: the raw value counts *down*
from zero in RTL, so Kumo's comparison reports "can scroll to the start" the
moment an RTL list is scrolled at all, and its arrows scroll the wrong way.

**The indicator is the one thing anchored physically.** Reka reports the active
tab's `offsetLeft`, which is measured from the left edge in both directions, so
mirroring it would put the indicator under the wrong tab in RTL.

**The scroll arithmetic lives in `useTabsScroll.js`**, next to the component
and separately testable — jsdom gives nothing a size, so the overflow maths is
exercised against plain numbers rather than a list that can never overflow.

**Motion is dropped under `prefers-reduced-motion`** — the sliding indicator,
the fading controls, and the smooth scrolling, which Kumo animates regardless.

**No `className` / `listClassName` / `indicatorClassName`.** Class props exist
in Kumo because its styling is Tailwind utilities. Here the classes are
`kv-tabs__list` and `kv-tabs__indicator` in a stylesheet you own.

## Toast

Notifications that stack in the corner, expand when you point at them, and can
be swiped away.

```vue
<!-- once, near the root of the app -->
<Toaster />
```

```js
import { toast } from "@/components/ui/toast";

toast.add({ title: "Saved", description: "Your changes are live." });
toast.add({ title: "Deployment failed", description: err.message, variant: "error" });

toast.promise(deploy(), {
  loading: { title: "Deploying…" },
  success: (worker) => ({ title: "Deployed!", description: worker.name, variant: "success" }),
  error: (error) => ({ title: "Deployment failed", description: error.message, variant: "error" }),
});
```

### The queue

| Method | Notes |
| --- | --- |
| `add(options)` | Returns the toast's id. Re-adding a live id bumps it instead of stacking a duplicate |
| `update(id, patch)` | Changes a toast in place; ignores ids that have gone |
| `close(id)` | Starts it leaving; it animates out and then drops itself |
| `clear()` | Closes everything — on a route change, say |
| `promise(p, { loading, success, error })` | Returns `p`, so the caller can still await it |

`add` options: `title`, `description`, `variant` (`default` `success` `error`
`warning` `info`), `actions`, `duration`, `id`. An action is a `Button`'s props
plus a `label` and an `onClick`.

### `<Toaster>`

| Prop | Type | Default |
| --- | --- | --- |
| `manager` | a queue from `createToastManager()` | the shared one |
| `duration` | `number` | `5000` |
| `limit` | `number` | `3` |
| `to` | portal target | `"body"` |
| `label` | `string` | `"Notifications ({hotkey})"` |
| `announceLabel` `closeLabel` | `string` | `"Notification"` · `"Close"` |
| `swipeDirection` | `right` `left` `up` `down` | `right` |

Slots: `toast` (scoped, receiving `toast`) to render the body yourself,
and a default slot for the tree a scoped queue belongs to.

Built on **Reka UI's Toast primitive**, which owns the countdown, the pause
while the pointer is over the viewport, the swipe gesture and the live region.
Base UI ships a toast *manager*; Reka does not, so the queue is written here —
which is why it is `manager.js`, a plain module with no DOM in it that can be
tested directly.

**The queue is a module, not a provider.** Kumo wraps the app in `<Toasty>` so
a React context can carry the manager, and needs `createKumoToastManager()`
threaded through it to raise a toast from outside the tree. Here `toast` is
imported wherever it is needed — an HTTP interceptor, a store action, a timer —
and `<Toaster />` only has to exist somewhere on the page. `createToastManager()`
still gives you an isolated queue, `<Toaster :manager>` renders it, and
`useToast()` finds it from inside that Toaster's children.

**Actions take a `label`.** Kumo passes React's `children` through its action
props; a Vue prop object cannot carry a slot, so the text is a `label` and
everything else is still `Button` props.

**Kumo's `bump` is the default, not a flag.** Adding a toast whose id is
already on screen bumps the one showing rather than stacking a duplicate —
useful when a retry keeps failing. Kumo does this too, through a manager
wrapper that resets the animation across two frames; here it is a counter on
the toast, which the animation keys off.

**Motion is dropped under `prefers-reduced-motion`**: the stack still opens and
closes, without sliding, scaling or animating out. Kumo animates regardless,
and a toast that slides and scales is exactly what the setting is asking about.

**Timers live in the primitive, not the queue.** Reka's `ToastRoot` already
counts down, pauses while the pointer is over the viewport and resumes after,
so a second timer in the store would only be a second source of truth. A
`duration` of `Infinity` — what `promise` gives its loading toast — never times
out.

**The stack is measured, not guessed.** Each toast reports its height, and the
expanded offsets are the sum of what is in front plus a gap. It is measured
from the *content*, not the toast: an earlier version measured the toast
itself, whose height the measurement then set, and the stack collapsed to its
own padding.

## Text

Typography: headings, copy and monospace at the sizes the system knows about.

```vue
<Text>Body copy.</Text>
<Text variant="heading" size="lg" as="h1">Page title</Text>
<Text variant="secondary" size="sm">Helper text</Text>
<Text variant="mono">console.log("code")</Text>
<Text truncate>A single line that gets cut off…</Text>
```

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `heading` `body` `secondary` `success` `error` `mono` `mono-secondary` · deprecated: `heading1` `heading2` `heading3` | `body` |
| `size` | `xs` `sm` `base` `lg` | `base` |
| `bold` | `boolean` | `false` |
| `truncate` | `boolean` | `false` |
| `as` | `string \| object` | `p` for copy, `span` otherwise |
| `asChild` | `boolean` | `false` |

The sizes each variant actually renders, matching Kumo:

| Variant | `xs` | `sm` | `base` | `lg` |
| --- | --- | --- | --- | --- |
| copy — `body` `secondary` `success` `error` | 12px | 13px | 14px | 16px |
| `heading` | 16px | 16px | 16px | 20px |
| `mono` `mono-secondary` | 13px | 13px | 13px | 14px |

**`variant` is presentation; `as` is meaning.** A heading variant renders a
`<span>` until you say otherwise, so heading-shaped text never joins the
document outline by accident — Kumo's rule, and the reason `<Text
variant="heading" as="h2">` is the way to write a real section heading.

**Monospace sits one step below the copy beside it.** A mono face at the same
nominal size reads larger, so `mono` is 13px where `body` is 14px. Kumo's
adjustment, kept.

**`bold` is copy-only**, as Kumo's types enforce. Here it is ignored on the
other variants, with a development warning rather than a compile error — the
same runtime stand-in Button uses for icon-only names.

**Copy sets a line height rather than inheriting one.** Kumo writes every copy
size as `text-sm/[inherit]` and so on, which composes nicely and falls back to
the browser's `normal` — about 1.2 — when nothing above sets one. That clips
Khmer subscripts, Thai vowel marks and Devanagari matras, which is exactly why
[the line-height scale here is floored at 1.4](../tokens/README.md). Copy and
monospace get a line height; override it in your own CSS if you want Kumo's
inheriting behaviour back.

**`success` is blue, because it is blue upstream.** Kumo's `success` text
variant resolves to `text-kumo-link`, not a green — visible in its own
`KUMO_TEXT_STYLING` table. This port matches it. For the green, point the rule
at `--kv-text-success`:

```css
.kv-text--success { color: var(--kv-text-success); }
```

**`heading1` `heading2` `heading3` are deprecated on arrival.** They are
deprecated upstream too, and warn in development here exactly as they do there,
because code being ported from Kumo still uses them. Use `heading` with a
`size` and an `as`.

**`class` and `style` pass straight through.** Kumo hides them behind
`DANGEROUS_className` and `DANGEROUS_style` to keep typography locked down;
that convention buys nothing in Vue, where attributes fall through to the
element.

**The three heading sizes are new tokens.** `--kv-text-xl` (20px), `-2xl`
(24px) and `-3xl` (30px) were added to the token package for this component —
the body scale stops at `lg`, and headings need the steps above it.

## Select

Choose one option, or several, from a fixed list. The value is constrained to
the list — that is the distinction from Autocomplete.

```vue
<Select v-model="fruit" :items="fruits" label="Fruit" placeholder="Choose…" />

<Select v-model="regions" :items="grouped" multiple placeholder="Any region">
  <template #item="{ item }">{{ item.label }}</template>
</Select>
```

| Prop | Type | Default |
| --- | --- | --- |
| `modelValue` | any, or an array when `multiple` | — |
| `items` | `string[]` · `{ label, value, disabled }[]` · `{ label, items }[]` | `[]` |
| `size` | `xs` `sm` `base` `lg` | `base` |
| `placeholder` | `string` | `""` |
| `multiple` | `boolean` | `false` |
| `loading` | `boolean` | `false` |
| `label` `description` `error` | `string` | `""` |
| `required` | `true` · `false` · unset | unset |
| `disabled` | `boolean` | `false` |
| `open` | `boolean` | — |

Slots: `item` (scoped), `value` (scoped, to render the trigger's contents
yourself). Emits `update:modelValue` and `update:open`.

**`required` is deliberately three-state.** `true` marks the field required,
`false` labels it "(optional)" as Kumo does, and leaving it unset shows
neither. That is why it has no default.

**The trigger shows labels, not values.** Reka renders the raw value; a
`{ label: "Workers", value: "workers" }` item would put `workers` on the
trigger. Values are resolved back to labels here, and joined with commas for a
multiple select.

**`loading` shows a shimmer** in place of the value and blocks interaction,
matching Kumo's skeleton.

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
