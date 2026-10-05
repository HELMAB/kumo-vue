// Ported from Cloudflare Kumo's code module (MIT). See /NOTICE.
export const BUNDLED_LANGS = {
  javascript: () => import("@shikijs/langs/javascript"),
  typescript: () => import("@shikijs/langs/typescript"),
  jsx: () => import("@shikijs/langs/jsx"),
  tsx: () => import("@shikijs/langs/tsx"),
  json: () => import("@shikijs/langs/json"),
  jsonc: () => import("@shikijs/langs/jsonc"),
  html: () => import("@shikijs/langs/html"),
  css: () => import("@shikijs/langs/css"),
  python: () => import("@shikijs/langs/python"),
  yaml: () => import("@shikijs/langs/yaml"),
  markdown: () => import("@shikijs/langs/markdown"),
  graphql: () => import("@shikijs/langs/graphql"),
  sql: () => import("@shikijs/langs/sql"),
  bash: () => import("@shikijs/langs/bash"),
  shell: () => import("@shikijs/langs/shellscript"),
  diff: () => import("@shikijs/langs/diff"),
  hcl: () => import("@shikijs/langs/hcl"),
  toml: () => import("@shikijs/langs/toml"),
};

export const LANGUAGE_ALIASES = {
  js: "javascript",
  cjs: "javascript",
  mjs: "javascript",
  ts: "typescript",
  cts: "typescript",
  mts: "typescript",
  sh: "bash",
  zsh: "bash",
  yml: "yaml",
  py: "python",
  md: "markdown",
  gql: "graphql",
};

/** The canonical name for a language or one of its aliases, or `null` if it is not bundled. */
export function normalizeLanguage(lang) {
  if (lang in BUNDLED_LANGS) return lang;
  return LANGUAGE_ALIASES[lang] ?? null;
}
