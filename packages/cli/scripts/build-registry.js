/**
 * Builds `registry/` from the component sources in `packages/ui`.
 *
 * `packages/ui` is the single source of truth: the component is developed and
 * tested there, and the registry is a snapshot of it. Nothing is hand-written
 * here, so what `add` copies is exactly what the tests ran against.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const UI_SRC = join(HERE, "../../ui/src");
const OUT = join(HERE, "../registry");

/**
 * Registry manifest.
 *
 * `dependencies` are npm packages the copied source imports. `files` are
 * copied verbatim, relative to the configured components directory.
 * `registryDependencies` names other registry components to pull in first -
 * empty for now, wired through so the first composite component needs no
 * change to `add`.
 */
const COMPONENTS = [
  {
    /*
     * Not a component: shared helpers that components pull in through
     * `registryDependencies`. Hidden from `add` with no arguments, but
     * installable by name if someone wants just the helpers.
     */
    name: "shared",
    description: "Helpers shared between components.",
    internal: true,
    dependencies: [],
    registryDependencies: [],
    files: [
      { source: "shared/items.js", path: "shared/items.js" },
      { source: "shared/field.css", path: "shared/field.css" },
      { source: "shared/toolbar.js", path: "shared/toolbar.js" },
    ],
  },
  {
    name: "autocomplete",
    description: "Free-form text input with a filtered suggestion list.",
    export: "Autocomplete",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["shared"],
    files: [
      { source: "autocomplete/Autocomplete.vue", path: "autocomplete/Autocomplete.vue" },
      { source: "autocomplete/index.js", path: "autocomplete/index.js" },
    ],
  },
  {
    name: "badge",
    description: "Status label with semantic and palette variants, icons and status dots.",
    export: "Badge",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "badge/Badge.vue", path: "badge/Badge.vue" },
      { source: "badge/index.js", path: "badge/index.js" },
    ],
  },
  {
    name: "banner",
    description: "Full-width message bar for informational, warning and error notices.",
    export: "Banner",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "banner/Banner.vue", path: "banner/Banner.vue" },
      { source: "banner/index.js", path: "banner/index.js" },
    ],
  },
  {
    name: "breadcrumbs",
    description: "Navigation trail showing where the current page sits in a hierarchy.",
    export: "Breadcrumbs",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    /* The copy button is a ghost Button, so `add breadcrumbs` brings one along. */
    registryDependencies: ["button"],
    files: [
      { source: "breadcrumbs/Breadcrumbs.vue", path: "breadcrumbs/Breadcrumbs.vue" },
      { source: "breadcrumbs/index.js", path: "breadcrumbs/index.js" },
    ],
  },
  {
    name: "checkbox",
    description: "Checkbox with a built-in label, and a group sharing one array value.",
    export: "Checkbox",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["shared"],
    files: [
      { source: "checkbox/Checkbox.vue", path: "checkbox/Checkbox.vue" },
      { source: "checkbox/CheckboxGroup.vue", path: "checkbox/CheckboxGroup.vue" },
      { source: "checkbox/index.js", path: "checkbox/index.js" },
    ],
  },
  {
    name: "clipboard-text",
    description: "Read-only field with a one-click copy-to-clipboard button.",
    export: "ClipboardText",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    /* The copy control is a ghost Button. */
    registryDependencies: ["button"],
    files: [
      { source: "clipboard-text/ClipboardText.vue", path: "clipboard-text/ClipboardText.vue" },
      { source: "clipboard-text/index.js", path: "clipboard-text/index.js" },
    ],
  },
  {
    name: "collapsible",
    description: "Disclosure: a label that shows and hides the content below it.",
    export: "Collapsible",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "collapsible/Collapsible.vue", path: "collapsible/Collapsible.vue" },
      { source: "collapsible/index.js", path: "collapsible/index.js" },
    ],
  },
  {
    name: "command-palette",
    description: "The ⌘K overlay: a search field over a list of commands.",
    export: "CommandPalette",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["shared"],
    files: [
      { source: "command-palette/CommandPalette.vue", path: "command-palette/CommandPalette.vue" },
      { source: "command-palette/items.js", path: "command-palette/items.js" },
      { source: "command-palette/index.js", path: "command-palette/index.js" },
    ],
  },
  {
    name: "date-picker",
    description: "Calendar for one date, several, or a range.",
    export: "DatePicker",
    /*
     * The calendar works in `@internationalized/date` values rather than in
     * `Date`, which is what gives it non-Gregorian calendars and arithmetic
     * that does not drift. Reka depends on it too, so this is already in the
     * tree - but the copied component imports it by name, so it is named here.
     */
    dependencies: ["reka-ui", "@kumo-vue/tokens", "@internationalized/date"],
    registryDependencies: [],
    files: [
      { source: "date-picker/DatePicker.vue", path: "date-picker/DatePicker.vue" },
      { source: "date-picker/dates.js", path: "date-picker/dates.js" },
      { source: "date-picker/index.js", path: "date-picker/index.js" },
    ],
  },
  {
    name: "dialog",
    description: "Modal window over the page, with everything behind it inert.",
    export: "Dialog",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    /* The close control in the corner is a square Button. */
    registryDependencies: ["button"],
    files: [
      { source: "dialog/Dialog.vue", path: "dialog/Dialog.vue" },
      { source: "dialog/index.js", path: "dialog/index.js" },
    ],
  },
  {
    name: "dropdown",
    description: "Menu of actions anchored to a trigger, with submenus, toggles and links.",
    export: "Dropdown",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "dropdown/Dropdown.vue", path: "dropdown/Dropdown.vue" },
      { source: "dropdown/DropdownItems.vue", path: "dropdown/DropdownItems.vue" },
      { source: "dropdown/items.js", path: "dropdown/items.js" },
      { source: "dropdown/index.js", path: "dropdown/index.js" },
    ],
  },
  {
    name: "empty",
    description: "Placeholder for a list, table or page with nothing to show.",
    export: "Empty",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    /* The command line is a ClipboardText, which brings a Button with it. */
    registryDependencies: ["clipboard-text"],
    files: [
      { source: "empty/Empty.vue", path: "empty/Empty.vue" },
      { source: "empty/index.js", path: "empty/index.js" },
    ],
  },
  {
    name: "label",
    description: "Text that names a form control, with optional and tooltip markers.",
    export: "Label",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["button", "tooltip"],
    files: [
      { source: "label/Label.vue", path: "label/Label.vue" },
      { source: "label/index.js", path: "label/index.js" },
    ],
  },
  {
    name: "input",
    description: "Single-line text field, on its own or in a labelled field.",
    export: "Input",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: ["shared"],
    files: [
      { source: "input/Input.vue", path: "input/Input.vue" },
      { source: "input/index.js", path: "input/index.js" },
    ],
  },
  {
    /*
     * The textarea wears `.kv-input` for everything but its height, so the
     * Input stylesheet has to be present - which is what this dependency is
     * for. It is a real dependency rather than duplicated CSS so the two
     * cannot drift once both are copied into a project.
     */
    name: "input-area",
    description: "Multi-line text field, optionally growing with its content.",
    export: "InputArea",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: ["input", "shared"],
    files: [
      { source: "input-area/InputArea.vue", path: "input-area/InputArea.vue" },
      { source: "input-area/useAutoResize.js", path: "input-area/useAutoResize.js" },
      { source: "input-area/index.js", path: "input-area/index.js" },
    ],
  },
  {
    name: "input-group",
    description: "Input with icons, addons, an inline suffix or attached buttons.",
    export: "InputGroup",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: ["button", "input", "shared"],
    files: [
      { source: "input-group/InputGroup.vue", path: "input-group/InputGroup.vue" },
      { source: "input-group/InputGroupAddon.vue", path: "input-group/InputGroupAddon.vue" },
      { source: "input-group/InputGroupButton.vue", path: "input-group/InputGroupButton.vue" },
      { source: "input-group/InputGroupInput.vue", path: "input-group/InputGroupInput.vue" },
      { source: "input-group/InputGroupSuffix.vue", path: "input-group/InputGroupSuffix.vue" },
      { source: "input-group/context.js", path: "input-group/context.js" },
      { source: "input-group/zone.js", path: "input-group/zone.js" },
      { source: "input-group/index.js", path: "input-group/index.js" },
    ],
  },
  {
    name: "tooltip",
    description: "Short explanation shown on hover or focus.",
    export: "Tooltip",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "tooltip/Tooltip.vue", path: "tooltip/Tooltip.vue" },
      { source: "tooltip/TooltipProvider.vue", path: "tooltip/TooltipProvider.vue" },
      { source: "tooltip/context.js", path: "tooltip/context.js" },
      { source: "tooltip/maybeProvider.js", path: "tooltip/maybeProvider.js" },
      { source: "tooltip/index.js", path: "tooltip/index.js" },
    ],
  },
  {
    name: "switch",
    description: "On/off control for a setting that takes effect immediately.",
    export: "Switch",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "switch/Switch.vue", path: "switch/Switch.vue" },
      { source: "switch/index.js", path: "switch/index.js" },
    ],
  },
  {
    name: "radio",
    description: "One choice from a short list, as a fieldset of radios.",
    export: "RadioGroup",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["shared"],
    files: [
      { source: "radio/RadioGroup.vue", path: "radio/RadioGroup.vue" },
      { source: "radio/index.js", path: "radio/index.js" },
    ],
  },
  {
    /* Wears `.kv-input`'s field styling, as InputArea does, so Input comes too. */
    name: "sensitive-input",
    description: "Masked field for a token or key, with reveal and copy.",
    export: "SensitiveInput",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: ["input", "shared"],
    files: [
      { source: "sensitive-input/SensitiveInput.vue", path: "sensitive-input/SensitiveInput.vue" },
      { source: "sensitive-input/index.js", path: "sensitive-input/index.js" },
    ],
  },
  {
    name: "tag-input",
    description: "Field that collects a list of short strings as chips.",
    export: "TagInput",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: ["button", "input", "shared"],
    files: [
      { source: "tag-input/TagInput.vue", path: "tag-input/TagInput.vue" },
      { source: "tag-input/index.js", path: "tag-input/index.js" },
    ],
  },
  {
    name: "select",
    description: "Choose one option, or several, from a fixed list.",
    export: "Select",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["shared"],
    files: [
      { source: "select/Select.vue", path: "select/Select.vue" },
      { source: "select/index.js", path: "select/index.js" },
    ],
  },
  {
    name: "tabs",
    description: "Segmented or underline tab bar with an animated indicator.",
    export: "Tabs",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["shared"],
    files: [
      { source: "tabs/Tabs.vue", path: "tabs/Tabs.vue" },
      { source: "tabs/useTabsScroll.js", path: "tabs/useTabsScroll.js" },
      { source: "tabs/index.js", path: "tabs/index.js" },
    ],
  },
  {
    name: "text",
    description: "Typography: headings, copy and monospace at the system's sizes.",
    export: "Text",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "text/Text.vue", path: "text/Text.vue" },
      { source: "text/index.js", path: "text/index.js" },
    ],
  },
  {
    name: "toast",
    description: "Toast notifications: a queue, a viewport, and the stack it draws.",
    export: "Toaster",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    /* Actions and the dismiss control are Buttons. */
    registryDependencies: ["button"],
    files: [
      { source: "toast/Toast.vue", path: "toast/Toast.vue" },
      { source: "toast/Toaster.vue", path: "toast/Toaster.vue" },
      { source: "toast/manager.js", path: "toast/manager.js" },
      { source: "toast/index.js", path: "toast/index.js" },
    ],
  },
  {
    name: "button",
    description: "Action trigger with six variants, four sizes and icon-only shapes.",
    export: "Button",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    /* The loading spinner is a Loader and `title` is a Tooltip, as in Kumo. */
    registryDependencies: ["loader", "tooltip"],
    files: [
      { source: "button/Button.vue", path: "button/Button.vue" },
      { source: "button/index.js", path: "button/index.js" },
    ],
  },
  {
    name: "button-group",
    description: "Joins a primary action and a dropdown trigger into one split button.",
    export: "ButtonGroup",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "button-group/ButtonGroup.vue", path: "button-group/ButtonGroup.vue" },
      { source: "button-group/index.js", path: "button-group/index.js" },
    ],
  },
  {
    name: "cloudflare-logo",
    description: "The Cloudflare logo and a Powered by Cloudflare badge.",
    export: "CloudflareLogo",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "cloudflare-logo/CloudflareLogo.vue", path: "cloudflare-logo/CloudflareLogo.vue" },
      { source: "cloudflare-logo/PoweredByCloudflare.vue", path: "cloudflare-logo/PoweredByCloudflare.vue" },
      { source: "cloudflare-logo/logo.js", path: "cloudflare-logo/logo.js" },
      { source: "cloudflare-logo/index.js", path: "cloudflare-logo/index.js" },
    ],
  },
  {
    name: "grid",
    description: "Responsive CSS grid with preset column layouts.",
    export: "Grid",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "grid/Grid.vue", path: "grid/Grid.vue" },
      { source: "grid/GridItem.vue", path: "grid/GridItem.vue" },
      { source: "grid/context.js", path: "grid/context.js" },
      { source: "grid/index.js", path: "grid/index.js" },
    ],
  },
  {
    name: "inline-copy-text",
    description: "Compact, borderless copy control for IDs and short values.",
    export: "InlineCopyText",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: ["text"],
    files: [
      { source: "inline-copy-text/InlineCopyText.vue", path: "inline-copy-text/InlineCopyText.vue" },
      { source: "inline-copy-text/index.js", path: "inline-copy-text/index.js" },
    ],
  },
  {
    name: "layer-card",
    description: "Card container for simple surfaces and layered layouts.",
    export: "LayerCard",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "layer-card/LayerCard.vue", path: "layer-card/LayerCard.vue" },
      { source: "layer-card/LayerCardPrimary.vue", path: "layer-card/LayerCardPrimary.vue" },
      { source: "layer-card/LayerCardSecondary.vue", path: "layer-card/LayerCardSecondary.vue" },
      { source: "layer-card/index.js", path: "layer-card/index.js" },
    ],
  },
  {
    name: "link",
    description: "Inline text link with underline, current-colour and plain variants.",
    export: "Link",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "link/Link.vue", path: "link/Link.vue" },
      { source: "link/LinkExternalIcon.vue", path: "link/LinkExternalIcon.vue" },
      { source: "link/LinkProvider.vue", path: "link/LinkProvider.vue" },
      { source: "link/context.js", path: "link/context.js" },
      { source: "link/index.js", path: "link/index.js" },
    ],
  },
  {
    name: "loader",
    description: "Animated circular spinner for loading states.",
    export: "Loader",
    dependencies: [],
    registryDependencies: [],
    files: [
      { source: "loader/Loader.vue", path: "loader/Loader.vue" },
      { source: "loader/index.js", path: "loader/index.js" },
    ],
  },
  {
    name: "meter",
    description: "Bar showing a measured value within a known range.",
    export: "Meter",
    dependencies: ["@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "meter/Meter.vue", path: "meter/Meter.vue" },
      { source: "meter/index.js", path: "meter/index.js" },
    ],
  },
  {
    name: "skeleton-line",
    description: "Shimmering placeholder line for text that is still loading.",
    export: "SkeletonLine",
    dependencies: [],
    registryDependencies: [],
    files: [
      { source: "skeleton-line/SkeletonLine.vue", path: "skeleton-line/SkeletonLine.vue" },
      { source: "skeleton-line/index.js", path: "skeleton-line/index.js" },
    ],
  },
  {
    name: "table-of-contents",
    description: "Presentational section navigation with an active indicator rail and scroll tracking.",
    export: "TableOfContents",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "table-of-contents/TableOfContents.vue", path: "table-of-contents/TableOfContents.vue" },
      { source: "table-of-contents/TableOfContentsTitle.vue", path: "table-of-contents/TableOfContentsTitle.vue" },
      { source: "table-of-contents/TableOfContentsList.vue", path: "table-of-contents/TableOfContentsList.vue" },
      { source: "table-of-contents/TableOfContentsItem.vue", path: "table-of-contents/TableOfContentsItem.vue" },
      { source: "table-of-contents/TableOfContentsGroup.vue", path: "table-of-contents/TableOfContentsGroup.vue" },
      { source: "table-of-contents/useTableOfContentsActiveId.js", path: "table-of-contents/useTableOfContentsActiveId.js" },
      { source: "table-of-contents/index.js", path: "table-of-contents/index.js" },
    ],
  },
  {
    name: "popover",
    description: "Accessible popup with rich content, anchored to a trigger.",
    export: "Popover",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "popover/Popover.vue", path: "popover/Popover.vue" },
      { source: "popover/index.js", path: "popover/index.js" },
    ],
  },
  {
    name: "toolbar",
    description: "Groups controls into one compact card with arrow-key navigation.",
    export: "Toolbar",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["shared", "button", "input-group"],
    files: [
      { source: "toolbar/Toolbar.vue", path: "toolbar/Toolbar.vue" },
      { source: "toolbar/ToolbarButton.vue", path: "toolbar/ToolbarButton.vue" },
      { source: "toolbar/ToolbarLink.vue", path: "toolbar/ToolbarLink.vue" },
      { source: "toolbar/ToolbarInput.vue", path: "toolbar/ToolbarInput.vue" },
      { source: "toolbar/ToolbarInputGroup.vue", path: "toolbar/ToolbarInputGroup.vue" },
      { source: "toolbar/index.js", path: "toolbar/index.js" },
    ],
  },
  {
    name: "pagination",
    description: "Page navigation controls with a page count and page size selector.",
    export: "Pagination",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["input-group", "select"],
    files: [
      { source: "pagination/Pagination.vue", path: "pagination/Pagination.vue" },
      { source: "pagination/PaginationInfo.vue", path: "pagination/PaginationInfo.vue" },
      { source: "pagination/PaginationPageSize.vue", path: "pagination/PaginationPageSize.vue" },
      { source: "pagination/PaginationControls.vue", path: "pagination/PaginationControls.vue" },
      { source: "pagination/PaginationSeparator.vue", path: "pagination/PaginationSeparator.vue" },
      { source: "pagination/context.js", path: "pagination/context.js" },
      { source: "pagination/index.js", path: "pagination/index.js" },
    ],
  },
  {
    name: "combobox",
    description: "Typeahead picker constrained to its items, with single, value and chip triggers.",
    export: "Combobox",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["shared", "label"],
    files: [
      { source: "combobox/Combobox.vue", path: "combobox/Combobox.vue" },
      { source: "combobox/index.js", path: "combobox/index.js" },
    ],
  },
  {
    name: "locale-provider",
    description: "App-wide strings for the text components render on their own.",
    export: "LocaleProvider",
    dependencies: [],
    registryDependencies: [],
    files: [
      { source: "locale-provider/LocaleProvider.vue", path: "locale-provider/LocaleProvider.vue" },
      { source: "locale-provider/context.js", path: "locale-provider/context.js" },
      { source: "locale-provider/index.js", path: "locale-provider/index.js" },
    ],
  },
  {
    name: "layer-dialog",
    description: "Responsive dialog with a sticky title inside its scrolling body; a bottom sheet on mobile.",
    export: "LayerDialog",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["button", "button-group", "dropdown", "locale-provider", "text"],
    files: [
      { source: "layer-dialog/LayerDialog.vue", path: "layer-dialog/LayerDialog.vue" },
      { source: "layer-dialog/LayerDialogAction.vue", path: "layer-dialog/LayerDialogAction.vue" },
      { source: "layer-dialog/index.js", path: "layer-dialog/index.js" },
    ],
  },
  {
    name: "table",
    description: "Semantic table with striped rows, compact and sticky headers, sticky columns and row selection.",
    export: "Table",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["checkbox"],
    files: [
      { source: "table/Table.vue", path: "table/Table.vue" },
      { source: "table/TableHeader.vue", path: "table/TableHeader.vue" },
      { source: "table/TableHead.vue", path: "table/TableHead.vue" },
      { source: "table/TableBody.vue", path: "table/TableBody.vue" },
      { source: "table/TableRow.vue", path: "table/TableRow.vue" },
      { source: "table/TableCell.vue", path: "table/TableCell.vue" },
      { source: "table/TableFooter.vue", path: "table/TableFooter.vue" },
      { source: "table/TableCheckCell.vue", path: "table/TableCheckCell.vue" },
      { source: "table/TableCheckHead.vue", path: "table/TableCheckHead.vue" },
      { source: "table/TableResizeHandle.vue", path: "table/TableResizeHandle.vue" },
      { source: "table/index.js", path: "table/index.js" },
    ],
  },
  {
    name: "code-highlighted",
    description: "Shiki-powered syntax highlighting, lazy-loaded through a ShikiProvider.",
    export: "CodeHighlighted",
    dependencies: ["shiki", "@kumo-vue/tokens"],
    registryDependencies: ["button"],
    files: [
      { source: "code-highlighted/languages.js", path: "code-highlighted/languages.js" },
      { source: "code-highlighted/context.js", path: "code-highlighted/context.js" },
      { source: "code-highlighted/ShikiProvider.vue", path: "code-highlighted/ShikiProvider.vue" },
      { source: "code-highlighted/CodeHighlighted.vue", path: "code-highlighted/CodeHighlighted.vue" },
      { source: "code-highlighted/index.js", path: "code-highlighted/index.js" },
    ],
  },
  {
    name: "flow",
    description: "Directed flow diagrams of nodes, parallel branches and connectors, on a pannable canvas.",
    export: "Flow",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "flow/Flow.vue", path: "flow/Flow.vue" },
      { source: "flow/FlowNode.vue", path: "flow/FlowNode.vue" },
      { source: "flow/FlowParallel.vue", path: "flow/FlowParallel.vue" },
      { source: "flow/FlowList.vue", path: "flow/FlowList.vue" },
      { source: "flow/FlowAnchor.vue", path: "flow/FlowAnchor.vue" },
      { source: "flow/context.js", path: "flow/context.js" },
      { source: "flow/layout.js", path: "flow/layout.js" },
      { source: "flow/connectors.js", path: "flow/connectors.js" },
      { source: "flow/index.js", path: "flow/index.js" },
    ],
  },
  {
    name: "sidebar",
    description: "Collapsible, resizable navigation sidebar with groups, menus, sub-menus and a mobile sheet.",
    export: "Sidebar",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: ["button", "link", "skeleton-line", "tooltip"],
    files: [
      { source: "sidebar/Sidebar.vue", path: "sidebar/Sidebar.vue" },
      { source: "sidebar/SidebarClose.vue", path: "sidebar/SidebarClose.vue" },
      { source: "sidebar/SidebarCollapsible.vue", path: "sidebar/SidebarCollapsible.vue" },
      { source: "sidebar/SidebarCollapsibleContent.vue", path: "sidebar/SidebarCollapsibleContent.vue" },
      { source: "sidebar/SidebarCollapsibleTrigger.vue", path: "sidebar/SidebarCollapsibleTrigger.vue" },
      { source: "sidebar/SidebarContent.vue", path: "sidebar/SidebarContent.vue" },
      { source: "sidebar/SidebarFooter.vue", path: "sidebar/SidebarFooter.vue" },
      { source: "sidebar/SidebarGroup.vue", path: "sidebar/SidebarGroup.vue" },
      { source: "sidebar/SidebarGroupLabel.vue", path: "sidebar/SidebarGroupLabel.vue" },
      { source: "sidebar/SidebarHeader.vue", path: "sidebar/SidebarHeader.vue" },
      { source: "sidebar/SidebarLoading.vue", path: "sidebar/SidebarLoading.vue" },
      { source: "sidebar/SidebarMenu.vue", path: "sidebar/SidebarMenu.vue" },
      { source: "sidebar/SidebarMenuBadge.vue", path: "sidebar/SidebarMenuBadge.vue" },
      { source: "sidebar/SidebarMenuButton.vue", path: "sidebar/SidebarMenuButton.vue" },
      { source: "sidebar/SidebarMenuChevron.vue", path: "sidebar/SidebarMenuChevron.vue" },
      { source: "sidebar/SidebarMenuItem.vue", path: "sidebar/SidebarMenuItem.vue" },
      { source: "sidebar/SidebarMenuSub.vue", path: "sidebar/SidebarMenuSub.vue" },
      { source: "sidebar/SidebarMenuSubButton.vue", path: "sidebar/SidebarMenuSubButton.vue" },
      { source: "sidebar/SidebarMenuSubItem.vue", path: "sidebar/SidebarMenuSubItem.vue" },
      { source: "sidebar/SidebarProvider.vue", path: "sidebar/SidebarProvider.vue" },
      { source: "sidebar/SidebarRail.vue", path: "sidebar/SidebarRail.vue" },
      { source: "sidebar/SidebarResizeHandle.vue", path: "sidebar/SidebarResizeHandle.vue" },
      { source: "sidebar/SidebarSeparator.vue", path: "sidebar/SidebarSeparator.vue" },
      { source: "sidebar/SidebarSlidingView.vue", path: "sidebar/SidebarSlidingView.vue" },
      { source: "sidebar/SidebarSlidingViews.vue", path: "sidebar/SidebarSlidingViews.vue" },
      { source: "sidebar/SidebarTrigger.vue", path: "sidebar/SidebarTrigger.vue" },
      { source: "sidebar/context.js", path: "sidebar/context.js" },
      { source: "sidebar/sidebar.css", path: "sidebar/sidebar.css" },
      { source: "sidebar/index.js", path: "sidebar/index.js" },
    ],
  },
];

await mkdir(OUT, { recursive: true });

const index = { components: [] };

for (const component of COMPONENTS) {
  const files = await Promise.all(
    component.files.map(async (file) => ({
      path: file.path,
      content: await readFile(join(UI_SRC, file.source), "utf8"),
    })),
  );

  const entry = { ...component, files };
  delete entry.files.source;

  await writeFile(join(OUT, `${component.name}.json`), `${JSON.stringify(entry, null, 2)}\n`);

  index.components.push({
    name: component.name,
    description: component.description,
    dependencies: component.dependencies,
    registryDependencies: component.registryDependencies,
    internal: component.internal ?? false,
  });

  console.log(`  Built ${component.name} (${files.length} files)`);
}

await writeFile(join(OUT, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(`  Wrote registry/index.json with ${index.components.length} component(s).`);
