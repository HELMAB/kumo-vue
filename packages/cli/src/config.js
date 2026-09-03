/**
 * Project configuration, held in `components.json` at the project root - the
 * same filename shadcn-vue uses, so the concept is already familiar.
 */

import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const CONFIG_FILE = "components.json";

export const DEFAULT_CONFIG = {
  $schema: "https://kumo-vue.dev/schema.json",
  componentsDir: "src/components/ui",
  importAlias: "@/components/ui",
  css: "src/assets/main.css",
};

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

export async function readConfig(cwd) {
  const path = join(cwd, CONFIG_FILE);
  if (!(await exists(path))) return null;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(await readFile(path, "utf8")) };
  } catch (error) {
    throw new Error(`${CONFIG_FILE} is not valid JSON: ${error.message}`);
  }
}

export async function writeConfig(cwd, config) {
  await writeFile(join(cwd, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`);
}

/**
 * Guess sensible defaults from the project layout, so `init` has something
 * better than a fixed answer to propose.
 */
export async function detectDefaults(cwd) {
  const config = { ...DEFAULT_CONFIG };
  const hasSrc = await exists(join(cwd, "src"));

  if (!hasSrc) {
    config.componentsDir = "components/ui";
    config.importAlias = "~/components/ui";
    config.css = "assets/css/main.css";
  }

  /* Nuxt puts components at the project root and uses the ~ alias. */
  for (const nuxtConfig of ["nuxt.config.js", "nuxt.config.ts", "nuxt.config.mjs"]) {
    if (await exists(join(cwd, nuxtConfig))) {
      config.componentsDir = hasSrc ? "src/components/ui" : "components/ui";
      config.importAlias = hasSrc ? "~/src/components/ui" : "~/components/ui";
      config.css = hasSrc ? "src/assets/css/main.css" : "assets/css/main.css";
      break;
    }
  }

  for (const candidate of [
    "src/assets/main.css",
    "src/assets/css/main.css",
    "src/style.css",
    "src/main.css",
    "assets/css/main.css",
  ]) {
    if (await exists(join(cwd, candidate))) {
      config.css = candidate;
      break;
    }
  }

  return config;
}

/** Package manager, inferred from the lockfile present. */
export async function detectPackageManager(cwd) {
  const lockfiles = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["bun.lock", "bun"],
    ["package-lock.json", "npm"],
  ];
  for (const [file, manager] of lockfiles) {
    if (await exists(join(cwd, file))) return manager;
  }
  return "npm";
}

export const installCommand = (manager, packages) =>
  manager === "npm"
    ? `npm install ${packages.join(" ")}`
    : `${manager} add ${packages.join(" ")}`;
