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
    name: "autocomplete",
    description: "Free-form text input with a filtered suggestion list.",
    export: "Autocomplete",
    dependencies: ["reka-ui", "@kumo-vue/tokens"],
    registryDependencies: [],
    files: [
      { source: "autocomplete/Autocomplete.vue", path: "autocomplete/Autocomplete.vue" },
      { source: "autocomplete/items.js", path: "autocomplete/items.js" },
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
  });

  console.log(`  Built ${component.name} (${files.length} files)`);
}

await writeFile(join(OUT, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(`  Wrote registry/index.json with ${index.components.length} component(s).`);
