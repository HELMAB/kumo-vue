/**
 * Argument parsing and dispatch.
 *
 * Kept to `node:util`'s parseArgs so the package has no dependencies - `npx
 * kumo-vue@latest add button` should be one small download, not a tree.
 */

import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { bold, cyan, dim, log } from "./log.js";
import { add } from "./commands/add.js";
import { init } from "./commands/init.js";

const HERE = dirname(fileURLToPath(import.meta.url));

async function version() {
  const pkg = JSON.parse(await readFile(join(HERE, "../package.json"), "utf8"));
  return pkg.version;
}

function usage() {
  log();
  log(`  ${bold("kumo-vue")} ${dim("- Kumo's design system, for Vue")}`);
  log();
  log(`  ${bold("Usage")}`);
  log(`    ${cyan("npx kumo-vue@latest init")}            ${dim("configure this project")}`);
  log(`    ${cyan("npx kumo-vue@latest add <name>")}      ${dim("copy a component in")}`);
  log(`    ${cyan("npx kumo-vue@latest add")}             ${dim("list what is available")}`);
  log();
  log(`  ${bold("Options")}`);
  log(`    ${cyan("-y, --yes")}         ${dim("accept defaults, never prompt")}`);
  log(`    ${cyan("-o, --overwrite")}   ${dim("replace existing files without asking")}`);
  log(`    ${cyan("-c, --cwd <dir>")}   ${dim("run against another directory")}`);
  log(`    ${cyan("-f, --force")}       ${dim("init: overwrite components.json")}`);
  log(`    ${cyan("-v, --version")}     ${dim("print the version")}`);
  log();
}

export async function run(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      yes: { type: "boolean", short: "y", default: false },
      overwrite: { type: "boolean", short: "o", default: false },
      force: { type: "boolean", short: "f", default: false },
      cwd: { type: "string", short: "c" },
      version: { type: "boolean", short: "v", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.version) {
    log(await version());
    return;
  }

  const [command, ...rest] = positionals;

  if (values.help || !command) {
    usage();
    return;
  }

  const options = {
    cwd: values.cwd ?? process.cwd(),
    yes: values.yes,
    overwrite: values.overwrite,
    force: values.force,
  };

  switch (command) {
    case "init":
      await init(options);
      return;
    case "add":
      await add(rest, options);
      return;
    default:
      throw new Error(
        `Unknown command "${command}". Run ${cyan("npx kumo-vue --help")} for usage.`,
      );
  }
}
