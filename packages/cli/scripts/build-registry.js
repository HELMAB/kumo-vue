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
    files: [{ source: "shared/items.js", path: "shared/items.js" }],
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
    registryDependencies: ["button"],
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
    registryDependencies: [],
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
    registryDependencies: ["input"],
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
    registryDependencies: ["button", "input"],
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
    registryDependencies: [],
    files: [
      { source: "button/Button.vue", path: "button/Button.vue" },
      { source: "button/index.js", path: "button/index.js" },
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
