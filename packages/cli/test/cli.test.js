/**
 * End-to-end tests over a temporary project directory. These exercise what a
 * user actually runs - `add button` into a real folder - rather than the
 * internals of the registry.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { run } from "../src/index.js";
import { add } from "../src/commands/add.js";
import { init } from "../src/commands/init.js";
import { getComponent, listComponents, resolveWithDependencies } from "../src/registry.js";

/**
 * Runs `setup` against a throwaway project directory. It gets a `src/` by
 * default, so the fixture looks like a Vite Vue app; pass `{ src: false }` for
 * the root-level layout Nuxt uses.
 */
async function project(setup, { src = true } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "kumo-vue-test-"));
  try {
    if (src) await mkdir(join(dir, "src"), { recursive: true });
    await setup(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const opts = (cwd) => ({ cwd, yes: true });

test("registry lists the button", async () => {
  const components = await listComponents();
  assert.ok(components.some((c) => c.name === "button"));
});

test("registry entry carries file contents and dependencies", async () => {
  const button = await getComponent("button");
  assert.equal(button.export, "Button");
  assert.deepEqual(button.dependencies, ["reka-ui", "@kumo-vue/tokens"]);
  assert.equal(button.files.length, 2);
  const sfc = button.files.find((f) => f.path === "button/Button.vue");
  assert.match(sfc.content, /<script setup>/);
  assert.match(sfc.content, /kv-button/);
});

test("unknown components name the ones that exist", async () => {
  await assert.rejects(() => getComponent("carousel"), /Unknown component "carousel"[\s\S]*button/);
});

test("dependency resolution is depth-first and deduplicated", async () => {
  const resolved = await resolveWithDependencies(["button", "button"]);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].name, "button");
});

test("add writes the component into the default directory", async () => {
  await project(async (dir) => {
    const { written } = await add(["button"], opts(dir));

    assert.deepEqual(written.sort(), [
      join("src/components/ui/button", "Button.vue"),
      join("src/components/ui/button", "index.js"),
    ].sort());

    const sfc = await readFile(join(dir, "src/components/ui/button/Button.vue"), "utf8");
    assert.match(sfc, /Ported from Cloudflare Kumo/);
    assert.match(sfc, /from "reka-ui"/);
  });
});

test("add honours components.json", async () => {
  await project(async (dir) => {
    await writeFile(
      join(dir, "components.json"),
      JSON.stringify({ componentsDir: "app/ui", importAlias: "~/ui" }),
    );
    const { written } = await add(["button"], opts(dir));
    assert.ok(written.every((p) => p.startsWith(join("app", "ui"))));
  });
});

test("a project without src/ gets the Nuxt-style layout", async () => {
  await project(async (dir) => {
    await writeFile(join(dir, "nuxt.config.ts"), "export default {}\n");
    const { written } = await add(["button"], opts(dir));
    assert.ok(written.every((p) => p.startsWith(join("components", "ui"))));
  }, { src: false });
});

test("existing files are skipped rather than clobbered", async () => {
  await project(async (dir) => {
    await add(["button"], opts(dir));
    const target = join(dir, "src/components/ui/button/Button.vue");
    await writeFile(target, "/* my edits */\n");

    const { written, skipped } = await add(["button"], opts(dir));
    assert.ok(skipped.some((p) => p.endsWith("Button.vue")));
    assert.ok(!written.some((p) => p.endsWith("Button.vue")));
    assert.equal(await readFile(target, "utf8"), "/* my edits */\n");
  });
});

test("--overwrite replaces them", async () => {
  await project(async (dir) => {
    await add(["button"], opts(dir));
    const target = join(dir, "src/components/ui/button/Button.vue");
    await writeFile(target, "/* my edits */\n");

    await add(["button"], { cwd: dir, yes: true, overwrite: true });
    assert.match(await readFile(target, "utf8"), /<script setup>/);
  });
});

test("init writes a config and add then follows it", async () => {
  await project(async (dir) => {
    const config = await init(opts(dir));
    assert.equal(config.componentsDir, "src/components/ui");

    const written = JSON.parse(await readFile(join(dir, "components.json"), "utf8"));
    assert.equal(written.importAlias, "@/components/ui");

    const { written: files } = await add(["button"], opts(dir));
    assert.ok(files.length > 0);
  });
});

test("init refuses to clobber an existing config without --force", async () => {
  await project(async (dir) => {
    await writeFile(join(dir, "components.json"), JSON.stringify({ componentsDir: "kept" }));
    const config = await init(opts(dir));
    assert.equal(config.componentsDir, "kept");
  });
});

test("the run() dispatcher rejects unknown commands", async () => {
  await assert.rejects(() => run(["frobnicate"]), /Unknown command "frobnicate"/);
});

test("run() dispatches add end to end", async () => {
  await project(async (dir) => {
    await run(["add", "button", "--yes", "--cwd", dir]);
    await readFile(join(dir, "src/components/ui/button/Button.vue"), "utf8");
  });
});
