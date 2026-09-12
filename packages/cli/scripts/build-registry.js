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
