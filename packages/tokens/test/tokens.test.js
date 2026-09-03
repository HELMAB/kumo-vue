/** Smoke tests over the generated output. Run after `pnpm build`. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { color, colorHex, colorVar, getColors, space, lineHeight } from "../dist/index.js";
import { eachToken } from "../scripts/resolve.js";

const css = await readFile(new URL("../dist/tokens.css", import.meta.url), "utf8");

test("every semantic token resolves in both modes", () => {
  for (const [key, value] of Object.entries(color)) {
    assert.match(value.light, /^oklch\(/, `${key} light`);
    assert.match(value.dark, /^oklch\(/, `${key} dark`);
  }
});

test("CSS and JavaScript expose the same token set", () => {
  for (const name of Object.values(colorVar)) {
    assert.ok(css.includes(`${name}:`), `${name} missing from tokens.css`);
  }
  assert.equal(Object.keys(color).length, eachToken().length);
});

test("every token is declared in both a light and a dark block", () => {
  const [, lightBlock] = css.split(/:root,\n  \[data-theme="light"\] \{/);
  const darkBlock = css.slice(css.lastIndexOf('[data-theme="dark"] {'));
  for (const name of Object.values(colorVar)) {
    assert.ok(lightBlock.includes(`${name}:`), `${name} missing light value`);
    assert.ok(darkBlock.includes(`${name}:`), `${name} missing dark value`);
  }
});

test("hex conversion covers every colour", () => {
  assert.deepEqual(Object.keys(colorHex), Object.keys(color));
  for (const [key, value] of Object.entries(colorHex)) {
    assert.match(value.light, /^#[0-9a-f]{6}([0-9a-f]{2})?$/, `${key} light`);
  }
});

test("getColors flattens to one mode", () => {
  const dark = getColors("dark");
  assert.equal(dark.surfaceBase, color.surfaceBase.dark);
  assert.equal(getColors("light", { format: "hex" }).surfaceBase, colorHex.surfaceBase.light);
  assert.throws(() => getColors("sepia"), TypeError);
});

test("stylesheet contains no directional properties", () => {
  const directional =
    /(^|[\s;{])(margin|padding|border|inset)?-?(left|right)\s*:/gm;
  assert.equal(css.match(directional), null);
});

test("line heights are generous enough for tall and stacked scripts", () => {
  for (const [key, value] of Object.entries(lineHeight)) {
    assert.ok(Number(value) >= 1.4, `${key} is ${value}, below the 1.4 floor`);
  }
});

test("spacing scale uses hyphens for decimal steps", () => {
  assert.equal(space["1-5"], "0.375rem");
  assert.ok(!Object.keys(space).some((k) => k.includes(".")));
});
