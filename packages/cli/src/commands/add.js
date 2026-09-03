/**
 * `kumo-vue add <component...>` - copy component source into the project.
 *
 * The copied files are yours: no import from this package remains at runtime,
 * and editing them is the expected workflow rather than a fork.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import { bold, cyan, dim, done, log, step, warn } from "../log.js";
import {
  CONFIG_FILE,
  DEFAULT_CONFIG,
  detectDefaults,
  detectPackageManager,
  installCommand,
  readConfig,
} from "../config.js";
import { confirm } from "../prompt.js";
import { listComponents, resolveWithDependencies } from "../registry.js";

const fileExists = async (path) => {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
};

export async function add(names, options = {}) {
  const cwd = options.cwd ?? process.cwd();

  if (names.length === 0) {
    const available = await listComponents();
    log();
    log(`  ${bold("Usage:")} npx kumo-vue add <component>`);
    log();
    log(`  ${bold("Available components")}`);
    for (const component of available) {
      log(`    ${cyan(component.name.padEnd(12))} ${dim(component.description)}`);
    }
    log();
    return { written: [], skipped: [] };
  }

  /*
   * Running `add` without a config is normal - shadcn-vue's flow starts with
   * `init`, but requiring it here would turn a one-command install into two.
   * Detected defaults are used and reported, and nothing is written to
   * components.json unless the user asked for it.
   */
  let config = await readConfig(cwd);
  if (!config) {
    config = await detectDefaults(cwd);
    warn(
      `No ${CONFIG_FILE} found. Using ${cyan(config.componentsDir)} ` +
        `${dim("(run `kumo-vue init` to choose)")}`,
    );
  }

  const components = await resolveWithDependencies(names);
  const written = [];
  const skipped = [];

  for (const component of components) {
    for (const file of component.files) {
      const target = join(cwd, config.componentsDir, file.path);

      if ((await fileExists(target)) && !options.overwrite) {
        const relativePath = relative(cwd, target);
        const replace =
          options.yes === true
            ? false
            : await confirm(`${relativePath} exists. Overwrite?`, false);
        if (!replace) {
          skipped.push(relativePath);
          continue;
        }
      }

      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, file.content);
      written.push(relative(cwd, target));
    }
  }

  log();
  for (const path of written) done(path);
  for (const path of skipped) warn(`skipped ${path} ${dim("(already exists)")}`);

  const dependencies = [
    ...new Set(components.flatMap((component) => component.dependencies ?? [])),
  ];

  if (dependencies.length) {
    const manager = await detectPackageManager(cwd);
    log();
    step("Make sure these are installed:");
    log(`      ${cyan(installCommand(manager, dependencies))}`);
  }

  const [first] = components;
  if (first && written.length) {
    log();
    step("Use it:");
    log(
      `      ${cyan(`import { ${first.export} } from "${config.importAlias}/${first.name}";`)}`,
    );
  }
  log();

  return { written, skipped };
}
