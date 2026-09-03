# `kumo-vue`

Add [Kumo Vue](https://github.com/kumo-vue/kumo-vue) components to your Vue 3
or Nuxt 3 project.

```sh
npx kumo-vue@latest add button
```

The component source is copied into your repository. There is no runtime
import from this package and no component library dependency — you own the
files, and editing them is the expected workflow rather than a fork.

## Commands

```sh
npx kumo-vue@latest init            # configure this project
npx kumo-vue@latest add button      # copy a component in
npx kumo-vue@latest add             # list what is available
```

| Option | Effect |
| --- | --- |
| `-y, --yes` | Accept defaults, never prompt |
| `-o, --overwrite` | Replace existing files without asking |
| `-c, --cwd <dir>` | Run against another directory |
| `-f, --force` | `init`: overwrite an existing `components.json` |

## Getting started

```sh
npm install reka-ui @kumo-vue/tokens
npx kumo-vue@latest add button
```

Then import the tokens once, in your global stylesheet:

```css
@import "@kumo-vue/tokens/styles";
```

Components read every colour, radius and space value from those custom
properties, so without this import they render unstyled.

```vue
<script setup>
import { Button } from "@/components/ui/button";
</script>

<template>
  <Button variant="primary">Save</Button>
</template>
```

## Configuration

`init` writes `components.json` at your project root:

```json
{
  "componentsDir": "src/components/ui",
  "importAlias": "@/components/ui",
  "css": "src/assets/main.css"
}
```

`add` works without it — the layout is detected from the project (a `src/`
directory, a `nuxt.config`) and reported before anything is written. Run `init`
when you want to pin the choice.

Files that already exist are never silently replaced: you are asked, and
declining leaves your edits alone. `--overwrite` skips the question, `--yes`
answers no to it. In a non-TTY environment every prompt takes its default, so
the CLI is usable in CI without extra flags.

## No network at install time

The registry ships inside this package. `npx kumo-vue@latest` already downloads
it, so fetching components over the network afterwards would only add failure
modes — offline, proxied, rate-limited — without adding anything: the component
you get is the one that shipped with the version you asked for.

The CLI itself has zero dependencies.

## Licence

MIT. Components are ported from [Cloudflare Kumo](https://github.com/cloudflare/kumo)
(MIT) — see [`/NOTICE`](../../NOTICE).
