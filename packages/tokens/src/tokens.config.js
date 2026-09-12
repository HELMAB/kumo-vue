/**
 * Semantic token names and their light/dark role assignments are adapted from
 * Cloudflare Kumo (https://github.com/cloudflare/kumo), MIT licensed.
 * See /NOTICE and /LICENSES/kumo-MIT.txt at the repository root.
 */

/**
 * Single source of truth for the token set. `scripts/build.js` generates both
 * the CSS custom properties and the JavaScript export from this file, so a
 * light value can never drift from its dark counterpart.
 *
 * Every colour is authored as OKLCH. The build converts to hex where consumers
 * need it (chart libraries, canvas), but OKLCH is the canonical form: it keeps
 * the neutral ramp perceptually even, which is what makes the light and dark
 * variants of a role read as the same weight.
 */

/**
 * Tier 1 - primitives. Raw scale values with no meaning attached.
 *
 * INTERNAL. These are emitted as CSS custom properties because semantic tokens
 * reference them through `var()`, but they are not part of the public API and
 * may change in any release. Consumers should reach for semantic tokens.
 */
export const primitives = {
  neutral: {
    0: "oklch(100% 0 0)",
    25: "oklch(98.75% 0 0)",
    50: "oklch(98.5% 0 0)",
    75: "oklch(98% 0 0)",
    100: "oklch(97% 0 0)",
    125: "oklch(96.5% 0 0)",
    150: "oklch(93.5% 0 0)",
    200: "oklch(92.2% 0 0)",
    300: "oklch(87% 0 0)",
    400: "oklch(70.8% 0 0)",
    500: "oklch(55.6% 0 0)",
    550: "oklch(53% 0 0)",
    600: "oklch(43.9% 0 0)",
    700: "oklch(37.1% 0 0)",
    750: "oklch(32% 0 0)",
    800: "oklch(26.9% 0 0)",
    850: "oklch(24% 0 0)",
    900: "oklch(21% 0 0)",
    925: "oklch(17% 0 0)",
    950: "oklch(15% 0 0)",
    975: "oklch(12% 0 0)",
    1000: "oklch(10% 0 0)",
  },
  blue: {
    100: "oklch(93.2% 0.032 255.6)",
    400: "oklch(70.7% 0.165 254.624)",
    500: "oklch(68.5% 0.169 237.323)",
    600: "oklch(54.6% 0.245 262.881)",
    700: "oklch(48.8% 0.243 264.376)",
    800: "oklch(42.4% 0.199 265.638)",
    900: "oklch(38% 0.145 265.5)",
  },
  red: {
    100: "oklch(93.6% 0.032 17.7)",
    400: "oklch(70.4% 0.191 22.216)",
    500: "oklch(63.7% 0.237 25.331)",
    600: "oklch(57.7% 0.245 27.325)",
    700: "oklch(50.5% 0.213 27.518)",
    800: "oklch(44.4% 0.177 26.9)",
    900: "oklch(42.9% 0.176 28.7)",
  },
  green: {
    100: "oklch(96.2% 0.043 156.7)",
    200: "oklch(90.5% 0.093 164.15)",
    400: "oklch(76.5% 0.177 163.223)",
    600: "oklch(59.6% 0.145 163.225)",
    700: "oklch(50.8% 0.118 165.612)",
    800: "oklch(43.2% 0.095 166.913)",
    900: "oklch(39.3% 0.096 152.3)",
  },
  amber: {
    100: "oklch(93.1% 0.107 94.6)",
    400: "oklch(75% 0.183 55.934)",
    500: "oklch(73.9% 0.177 58.2)",
    550: "oklch(59.7% 0.144 57.5)",
    600: "oklch(64.5% 0.168 50)",
    700: "oklch(55.5% 0.134 57.5)",
    800: "oklch(47% 0.113 57)",
    900: "oklch(35.3% 0.079 65)",
  },
  /**
   * Placeholder brand hue. Kumo's own brand values are Cloudflare's and are
   * deliberately NOT copied here - a naming convention can be adapted, a
   * company's brand colour cannot. Override `--kv-brand` to make it yours.
   */
  purple: {
    600: "oklch(55.8% 0.288 302.321)",
    700: "oklch(49.6% 0.265 301.924)",
  },
  teal: {
    200: "oklch(91% 0.096 180.426)",
    650: "oklch(54.9% 0.096 184.565)",
    700: "oklch(51.1% 0.096 186.391)",
    800: "oklch(43.7% 0.078 188.216)",
  },
  /**
   * Kumo's badge orange, which is a lighter and more saturated hue than the
   * `amber` ramp the warning tokens use. Kept separate rather than folded in,
   * because the two are not steps of one scale.
   */
  orange: {
    200: "oklch(90.1% 0.076 70.697)",
    650: "oklch(81.5% 0.197 76)",
    800: "oklch(47% 0.157 37.304)",
  },
  /**
   * Danger as a *fill*, as distinct from `red` used as a status colour. Kumo
   * uses one token for both; they are split here so the fill can be retargeted
   * for contrast without moving the status colour with it.
   *
   * These are Kumo's values, which put a white label below WCAG AA. See the
   * accessibility note in packages/ui/README.md for the override that fixes it.
   */
  dangerFill: {
    base: "oklch(63.7% 0.237 25.331)",
    dark: "oklch(57.7% 0.245 27.325)",
  },
  brand: {
    base: "oklch(57.72% 0.2324 260)",
    hover: "oklch(48.8% 0.243 264.376)",
    /** Brand as text. See the note below - it cannot be the fill value. */
    text: "oklch(49% 0.22 260)",
    /**
     * Brand-as-text and brand-as-fill are separate values in both modes.
     *
     * A fill carries a white label, so it wants to be dark; the same colour
     * used as text sits on a light surface, so it wants to be darker still -
     * Kumo's blue reads 4.37:1 on `surface-canvas`, just under AA. In dark
     * mode the two pull in opposite directions outright: the text has to be
     * light against a dark surface, the fill dark under white text.
     */
    dark: "oklch(65% 0.17 258)",
    darkHover: "oklch(71% 0.15 256)",
    darkFill: "oklch(51.95% 0.2092 260)",
    /*
     * Kumo darkens to blue-700 on hover in both modes, which on a dark surface
     * leaves the hover state (2.80:1) less visible than the resting fill.
     * Dark mode lightens instead. The button does not read this token - it
     * mixes its own hover from the fill, exactly as Kumo does - so this only
     * affects consumers using the token directly.
     */
    darkFillHover: "oklch(56% 0.205 258)",
  },
};

/**
 * Tier 2 - semantic tokens. Role-based aliases over the primitives. This is
 * the public API; every entry resolves in both light and dark mode.
 *
 * `ref` names a primitive as `hue.step` so the CSS output can emit a `var()`
 * chain (overriding a primitive cascades into every role built on it).
 * `value` carries a literal for the handful of roles - translucent lines,
 * status tints, shadows - that are alpha-composited rather than flat.
 */
export const color = {
  text: {
    default: { light: { ref: "neutral.900" }, dark: { ref: "neutral.100" } },
    strong: { light: { ref: "neutral.950" }, dark: { ref: "neutral.50" } },
    subtle: { light: { ref: "neutral.550" }, dark: { ref: "neutral.400" } },
    placeholder: { light: { ref: "neutral.500" }, dark: { ref: "neutral.400" } },
    inactive: { light: { ref: "neutral.400" }, dark: { ref: "neutral.600" } },
    inverse: { light: { ref: "neutral.50" }, dark: { ref: "neutral.900" } },
    brand: { light: { ref: "brand.text" }, dark: { ref: "brand.dark" } },
    link: { light: { ref: "blue.800" }, dark: { ref: "blue.400" } },
    info: { light: { ref: "blue.800" }, dark: { ref: "blue.400" } },
    success: { light: { ref: "green.800" }, dark: { ref: "green.200" } },
    warning: { light: { ref: "amber.550" }, dark: { ref: "amber.400" } },
    danger: { light: { ref: "red.700" }, dark: { ref: "red.400" } },
  },
  surface: {
    canvas: { light: { ref: "neutral.25" }, dark: { ref: "neutral.1000" } },
    base: { light: { ref: "neutral.0" }, dark: { ref: "neutral.925" } },
    elevated: { light: { ref: "neutral.75" }, dark: { ref: "neutral.975" } },
    recessed: { light: { ref: "neutral.125" }, dark: { ref: "neutral.950" } },
    tint: { light: { ref: "neutral.100" }, dark: { ref: "neutral.800" } },
    contrast: { light: { ref: "neutral.975" }, dark: { ref: "neutral.25" } },
    /*
     * Kumo's own neutral-50, which is 98.75% - not Tailwind's, which is 98.5%
     * and sits at `neutral.50` here. `canvas` reads the same stop upstream.
     */
    overlay: { light: { ref: "neutral.25" }, dark: { ref: "neutral.800" } },
    control: { light: { ref: "neutral.0" }, dark: { ref: "neutral.900" } },
  },
  interact: {
    fill: { light: { ref: "neutral.200" }, dark: { ref: "neutral.800" } },
    "fill-hover": { light: { ref: "neutral.125" }, dark: { ref: "neutral.700" } },
    interact: { light: { ref: "neutral.300" }, dark: { ref: "neutral.700" } },
    brand: { light: { ref: "brand.base" }, dark: { ref: "brand.darkFill" } },
    "brand-hover": { light: { ref: "brand.hover" }, dark: { ref: "brand.darkFillHover" } },
    /** Filled danger surface for destructive actions; pairs with a white label. */
    "danger-fill": { light: { ref: "dangerFill.base" }, dark: { ref: "dangerFill.dark" } },
    focus: { light: { ref: "neutral.950" }, dark: { ref: "neutral.150" } },
  },
  border: {
    /**
     * `line` and `hairline` are decorative separators - dividers, card edges,
     * table rules. WCAG 1.4.11 governs boundaries "required to identify" a
     * control, which these are not, so they sit below 3:1 by design. Use
     * `line-strong` for anything that delimits an actual control.
     */
    line: { light: { value: "oklch(14.5% 0 0 / 0.1)" }, dark: { ref: "neutral.750" } },
    hairline: { light: { ref: "neutral.150" }, dark: { ref: "neutral.800" } },
    /** Perceivable control boundary: input borders, checkbox and radio outlines. */
    "line-strong": { light: { ref: "neutral.500" }, dark: { ref: "neutral.500" } },
    /*
     * The two halves of a popup arrow's border, which is `line` by another
     * name: exactly one of them is painted in each mode, and it carries the
     * value `line` carries there. They exist because an arrow's border cannot
     * be one path - the outline has to sit outside the shape in light mode and
     * inside it in dark, and the two geometries differ. Kumo names them the
     * same way and for the same reason. The unpainted half is `oklch(0% 0 0 / 0)`
     * rather than the `transparent` keyword, so that every value in this file
     * stays a colour the build can measure.
     */
    "arrow-edge": { light: { value: "oklch(14.5% 0 0 / 0.1)" }, dark: { value: "oklch(0% 0 0 / 0)" } },
    "arrow-stroke": { light: { value: "oklch(0% 0 0 / 0)" }, dark: { ref: "neutral.750" } },
  },
  status: {
    info: { light: { ref: "blue.600" }, dark: { ref: "blue.500" } },
    "info-tint": {
      light: { value: "oklch(93.2% 0.032 255.6 / 0.45)" },
      dark: { value: "oklch(38% 0.145 265.5 / 0.22)" },
    },
    success: { light: { ref: "green.600" }, dark: { ref: "green.400" } },
    "success-tint": {
      light: { value: "oklch(96.2% 0.043 156.7 / 0.57)" },
      dark: { value: "oklch(39.3% 0.096 152.3 / 0.2)" },
    },
    warning: { light: { ref: "amber.500" }, dark: { ref: "amber.600" } },
    "warning-tint": {
      light: { value: "oklch(93.1% 0.107 94.6 / 0.2)" },
      dark: { value: "oklch(35.3% 0.079 65 / 0.37)" },
    },
    danger: { light: { ref: "red.500" }, dark: { ref: "red.600" } },
    "danger-tint": {
      light: { value: "oklch(93.6% 0.032 17.7 / 0.42)" },
      dark: { value: "oklch(42.9% 0.176 28.7 / 0.17)" },
    },
  },
  /**
   * Badge palette.
   *
   * These were left out of the first cut of this package as "component
   * specific". That was wrong: a badge colour has to resolve in both modes,
   * and the only alternatives are hardcoding theme selectors inside a
   * component file or pointing copied components at internal primitives.
   * Both are worse than naming them here.
   *
   * The `-text` entries are foregrounds for the subtle variants; the filled
   * variants carry a plain white or black label chosen by the component.
   */
  badge: {
    red: { light: { ref: "red.600" }, dark: { ref: "red.700" } },
    green: { light: { ref: "green.600" }, dark: { ref: "green.700" } },
    orange: { light: { ref: "orange.650" }, dark: { ref: "orange.650" } },
    purple: { light: { ref: "purple.600" }, dark: { ref: "purple.700" } },
    teal: { light: { ref: "teal.650" }, dark: { ref: "teal.700" } },
    blue: { light: { ref: "blue.600" }, dark: { ref: "blue.700" } },
    neutral: { light: { ref: "neutral.500" }, dark: { ref: "neutral.600" } },
    inverted: { light: { ref: "neutral.950" }, dark: { ref: "neutral.0" } },
    "inverted-text": { light: { ref: "neutral.0" }, dark: { ref: "neutral.1000" } },
    "teal-subtle-text": { light: { ref: "teal.800" }, dark: { ref: "teal.200" } },
    "orange-subtle-text": { light: { ref: "orange.800" }, dark: { ref: "orange.200" } },
    "neutral-subtle-text": { light: { ref: "neutral.800" }, dark: { ref: "neutral.200" } },
  },
  shadow: {
    "shadow-edge": {
      light: { value: "oklch(0% 0 0 / 0.12)" },
      dark: { value: "oklch(100% 0 0 / 0.1)" },
    },
    /** The resting 1px shadow under a control. Kumo's `shadow-xs`. */
    "shadow-drop": {
      light: { value: "oklch(0% 0 0 / 0.05)" },
      dark: { value: "oklch(0% 0 0 / 0.3)" },
    },
    /**
     * The deeper shadow under something floating above the page - a popup or
     * a menu. Kumo's `shadow-lg`, which is twice the strength of `shadow-xs`;
     * one token cannot serve both without one of them being wrong.
     */
    "shadow-elevated": {
      light: { value: "oklch(0% 0 0 / 0.1)" },
      dark: { value: "oklch(0% 0 0 / 0.5)" },
    },
  },
};

/**
 * Spacing. A 0.25rem base with half-steps at the low end, matching the rhythm
 * Kumo's components actually use (1.5 and 2.5 are load-bearing there, not
 * rounding errors). Keys use `-` for the decimal point: `1.5` -> `--kv-space-1-5`.
 */
export const space = {
  0: "0",
  "0-5": "0.125rem",
  1: "0.25rem",
  "1-5": "0.375rem",
  2: "0.5rem",
  "2-5": "0.625rem",
  3: "0.75rem",
  "3-5": "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
};

/** Corner radii. Named steps rather than a numeric scale, as in Kumo. */
export const radius = {
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  full: "9999px",
};

/**
 * Type sizes, carried over from Kumo unchanged. The scale is deliberately
 * compact - 14px body, not 16px - which is what gives Kumo its dense,
 * control-panel feel.
 *
 * The three sizes above `lg` are the heading steps. Kumo remaps Tailwind's
 * `xs` through `lg` to the compact values below and leaves `xl`, `2xl` and
 * `3xl` at Tailwind's defaults, which is where 20 / 24 / 30px come from.
 */
export const fontSize = {
  xs: "0.75rem",
  sm: "0.8125rem",
  base: "0.875rem",
  lg: "1rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
};

/**
 * Line heights. NOT carried over from Kumo, deliberately.
 *
 * Kumo's `sm` line-height is `calc(1 / 0.85)`, about 1.18 - roughly 15px of
 * leading on 13px text. That is fine for Latin, and clips Khmer stacked
 * subscripts, Thai upper and lower vowel marks, and Devanagari matras, all of
 * which extend well past the Latin ascender and descender bounds.
 *
 * These values are floored at 1.4 and step up from there. `relaxed` is the
 * right default for body copy in any script; `tight` is safe only for
 * single-line, all-Latin content such as button labels.
 */
export const lineHeight = {
  tight: "1.4",
  normal: "1.5",
  relaxed: "1.7",
  loose: "1.9",
};

/**
 * Font stacks.
 *
 * The Noto entries are fallbacks, not requirements - a system without them
 * degrades to the platform UI font, which on every current OS already covers
 * the major non-Latin scripts. They are listed so that a system which *does*
 * have Noto installed picks a face designed to sit alongside the Latin one.
 *
 * To supply script-specific fonts, redefine the token on `:root` after the
 * stylesheet import; see the package README.
 */
export const fontFamily = {
  sans: [
    "system-ui",
    "-apple-system",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    '"Noto Sans"',
    '"Noto Sans Arabic"',
    '"Noto Sans Devanagari"',
    '"Noto Sans Khmer"',
    '"Noto Sans Thai"',
    '"Noto Sans JP"',
    '"Noto Sans KR"',
    '"Noto Sans SC"',
    "sans-serif",
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
  ].join(", "),
  mono: [
    "ui-monospace",
    '"SFMono-Regular"',
    "Menlo",
    "Consolas",
    '"Liberation Mono"',
    '"Noto Sans Mono"',
    "monospace",
  ].join(", "),
};

/**
 * Contrast pairs asserted by `scripts/check-contrast.js`.
 *
 * `on` names the surface the foreground sits against. `over` is the opaque
 * backdrop used to flatten translucent surfaces before measuring - a status
 * tint is see-through, so its effective contrast depends on what is behind it.
 *
 * `min` is 4.5 for body text (WCAG AA 1.4.3) and 3 for large text and for
 * non-text boundaries such as borders and focus rings (AA 1.4.11).
 */
const KUMO_PARITY =
  "matches Kumo upstream; see packages/ui/README.md for the AA overrides";

export const contrastPairs = [
  { fg: "text.default", on: "surface.canvas", min: 4.5 },
  { fg: "text.default", on: "surface.base", min: 4.5 },
  { fg: "text.default", on: "surface.elevated", min: 4.5 },
  { fg: "text.default", on: "surface.recessed", min: 4.5 },
  { fg: "text.default", on: "surface.tint", min: 4.5 },
  { fg: "text.default", on: "interact.fill", min: 4.5 },
  { fg: "text.strong", on: "surface.base", min: 4.5 },
  { fg: "text.subtle", on: "surface.base", min: 4.5 },
  { fg: "text.subtle", on: "surface.canvas", min: 4.5 },
  { fg: "text.subtle", on: "surface.recessed", min: 4.5 },
  { fg: "text.placeholder", on: "surface.control", min: 4.5 },
  { fg: "text.inverse", on: "surface.contrast", min: 4.5 },
  { fg: "text.brand", on: "surface.base", min: 4.5 },
  { fg: "text.brand", on: "surface.canvas", min: 4.5 },
  { fg: "text.link", on: "surface.base", min: 4.5 },
  { fg: "text.link", on: "surface.canvas", min: 4.5 },
  { fg: "text.info", on: "status.info-tint", over: "surface.base", min: 4.5 },
  { fg: "text.success", on: "status.success-tint", over: "surface.base", min: 4.5 },
  /*
   * Kumo's amber. Below target at upstream's value, reported rather than
   * enforced for the same reason the filled button is: this port matches
   * Kumo's colours. See packages/ui/README.md for the AA overrides.
   */
  {
    fg: "text.warning",
    on: "status.warning-tint",
    over: "surface.base",
    min: 4.5,
    accepted: KUMO_PARITY,
  },
  { fg: "text.danger", on: "status.danger-tint", over: "surface.base", min: 4.5 },
  { fg: "text.danger", on: "surface.base", min: 4.5 },
  { fg: "status.info", on: "surface.base", min: 3 },
  { fg: "status.success", on: "surface.base", min: 3 },
  { fg: "status.warning", on: "surface.base", min: 3, accepted: KUMO_PARITY },
  { fg: "status.danger", on: "surface.base", min: 3 },
  { fg: "border.line-strong", on: "surface.base", min: 3 },
  { fg: "border.line-strong", on: "surface.control", min: 3 },
  /** Decorative separators - measured for visibility, exempt from 1.4.11. */
  { fg: "border.line", on: "surface.base", over: "surface.base", min: 3, exempt: true },
  { fg: "border.hairline", on: "surface.base", min: 3, exempt: true },
  { fg: "interact.focus", on: "surface.base", min: 3 },
  { fg: "interact.focus", on: "surface.canvas", min: 3 },
  { fg: "interact.brand", on: "surface.base", min: 3 },
  { fg: "interact.brand-hover", on: "surface.base", min: 3 },
  { fg: "interact.danger-fill", on: "surface.base", min: 3 },
  { fg: "badge.inverted-text", on: "badge.inverted", min: 4.5 },
  { fg: "badge.teal-subtle-text", on: "surface.base", min: 4.5 },
  { fg: "badge.orange-subtle-text", on: "surface.base", min: 4.5 },
  { fg: "badge.neutral-subtle-text", on: "surface.base", min: 4.5 },
  /**
   * Disabled text is exempt from 1.4.3, but a token nobody can read is still a
   * bug. Held to the 3:1 non-text floor and reported separately.
   */
  { fg: "text.inactive", on: "surface.base", min: 3, exempt: true },
];
