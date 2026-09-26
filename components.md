# Missing components

Components in [Cloudflare Kumo](https://kumo-ui.com) that `@kumo-vue/ui`
(`packages/ui/src`) does not have yet.

Sources: the kumo-ui.com sidebar and the upstream repo
(`cloudflare/kumo`, `packages/kumo/src/components` and `packages/kumo/src/blocks`).
Checked 2026-09-26. kumo-vue has 35 of the 45 documented components.

## Components

Upstream directory names are in parentheses.

### Small

- [x] Button Group (`button-group`)
- [x] Cloudflare Logo (`cloudflare-logo`)
- [x] Grid (`grid`)
- [x] Inline Copy Text (`inline-copy-text`)
- [x] Layer Card (`layer-card`, built on `surface`)
- [x] Link (`link`)
- [x] Loader (`loader`)
- [x] Meter (`meter`)
- [x] Skeleton Line (`loader/skeleton-line`)

### Medium

- [ ] Combobox (`combobox`)
- [ ] Layer Dialog (`layer-dialog`)
- [x] Pagination (`pagination`)
- [x] Popover (`popover`)
- [x] Table of Contents (`table-of-contents`)
- [x] Toolbar (`toolbar`)

### Large

- [ ] CodeHighlighted (`code`, needs a syntax highlighter)
- [ ] Flow (`flow`)
- [ ] Sidebar (`sidebar`)
- [ ] Table (`table`)

## Upstream source, not on the docs site

These are in the upstream repo but have no page on kumo-ui.com. `field` and
`surface` probably back other components (form fields, Layer Card).

- [ ] Date Range Picker (`date-range-picker`)
- [ ] Field (`field`)
- [ ] Menubar (`menubar`)
- [ ] Surface (`surface`)

## Charts

- [ ] Chart (`chart`)
- [ ] Timeseries
- [ ] Maps
- [ ] Sankey
- [ ] Custom Chart
- [ ] Chart color palette

## Blocks

- [ ] Page Header (`page-header`)
- [ ] Resource List (`resource-list`)
- [ ] Delete Resource (`delete-resource`)

## Already implemented (35)

Autocomplete, Badge, Banner, Breadcrumbs, Button, Button Group, Checkbox,
Clipboard Text, Cloudflare Logo, Collapsible, Command Palette, Date Picker,
Dialog, Dropdown, Empty, Grid, Inline Copy Text, Input, InputArea, InputGroup,
Label, Layer Card, Link, Loader, Meter, Radio, Select, Sensitive Input,
Skeleton Line, Switch, Tabs, Tag Input, Text, Toast, Tooltip.

This list only checks that each component exists. It does not compare props,
variants or behaviour with upstream.
