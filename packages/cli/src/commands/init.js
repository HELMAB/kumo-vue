/**
 * `kumo-vue init` - write components.json and report what the project still
 * needs. It deliberately does not install anything or edit your CSS: printing
 * the two commands is clearer than silently rewriting files, and `add` works
 * whether or not `init` has been run.
 */

import { bold, cyan, dim, done, log, step, warn } from "../log.js";
import {
  CONFIG_FILE,
  detectDefaults,
  detectPackageManager,
  installCommand,
  readConfig,
  writeConfig,
} from "../config.js";
import { ask, confirm } from "../prompt.js";

export async function init(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const existing = await readConfig(cwd);

  if (existing && !options.force) {
    warn(`${CONFIG_FILE} already exists. Re-run with --force to overwrite.`);
    return existing;
  }

  const defaults = await detectDefaults(cwd);
  const config = options.yes
    ? defaults
    : {
        ...defaults,
        componentsDir: await ask("Where should components go?", defaults.componentsDir),
        importAlias: await ask("Import alias for that directory?", defaults.importAlias),
        css: await ask("Which stylesheet imports your global CSS?", defaults.css),
      };

  await writeConfig(cwd, config);
  done(`Wrote ${CONFIG_FILE}`);

  const manager = await detectPackageManager(cwd);
  log();
  log(`  ${bold("Two things left to do:")}`);
  log();
  step(`Install the runtime dependencies:`);
  log(`      ${cyan(installCommand(manager, ["reka-ui", "@kumo-vue/tokens"]))}`);
  log();
  step(`Import the tokens once, in ${config.css}:`);
  log(`      ${cyan('@import "@kumo-vue/tokens/styles";')}`);
  log(`      ${dim("Components read their colours from these custom properties.")}`);
  log();

  return config;
}
