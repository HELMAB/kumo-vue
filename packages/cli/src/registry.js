/**
 * Registry access.
 *
 * The registry ships inside this package rather than being fetched over the
 * network. `npx kumo-vue@latest` already downloads the package, so a remote
 * fetch would add a failure mode - offline, proxied, rate-limited - without
 * adding anything: the component you get is the one that shipped with the
 * version you asked for.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY_DIR = join(dirname(fileURLToPath(import.meta.url)), "../registry");

export async function listComponents() {
  const index = JSON.parse(await readFile(join(REGISTRY_DIR, "index.json"), "utf8"));
  return index.components;
}

export async function getComponent(name) {
  try {
    return JSON.parse(await readFile(join(REGISTRY_DIR, `${name}.json`), "utf8"));
  } catch {
    const available = (await listComponents()).map((c) => c.name);
    throw new Error(
      `Unknown component "${name}".\n  Available: ${available.join(", ")}`,
    );
  }
}

/**
 * Resolve a component and everything it depends on, depth first, with each
 * entry appearing once. Nothing depends on anything yet, but `add` should not
 * have to change when the first composite component lands.
 */
export async function resolveWithDependencies(names) {
  const seen = new Set();
  const resolved = [];

  async function visit(name) {
    if (seen.has(name)) return;
    seen.add(name);
    const component = await getComponent(name);
    for (const dependency of component.registryDependencies ?? []) {
      await visit(dependency);
    }
    resolved.push(component);
  }

  for (const name of names) await visit(name);
  return resolved;
}
