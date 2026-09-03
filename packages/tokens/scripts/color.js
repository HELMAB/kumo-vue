/**
 * Colour maths for the token build: OKLCH -> sRGB, alpha compositing, and
 * WCAG relative luminance / contrast ratio.
 *
 * Build-time only. Nothing here ships in the package's runtime export, which
 * keeps `@kumo-vue/tokens` free of runtime dependencies.
 */

const OKLCH_RE =
  /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/;

/** Parse an `oklch(L% C H[ / A])` string into components. */
export function parseOklch(value) {
  const match = OKLCH_RE.exec(value.trim());
  if (!match) throw new Error(`Not a parseable oklch() colour: ${value}`);
  return {
    l: Number(match[1]) / 100,
    c: Number(match[2]),
    h: Number(match[3]),
    alpha: match[4] === undefined ? 1 : Number(match[4]),
  };
}

/** OKLCH -> linear-light sRGB, clamped to gamut. Returns {r,g,b,alpha} in 0..1. */
export function oklchToLinearSrgb(value) {
  const { l: L, c: C, h: H, alpha } = parseOklch(value);
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const lp = L + 0.3963377774 * a + 0.2158037573 * b;
  const mp = L - 0.1055613458 * a - 0.0638541728 * b;
  const sp = L - 0.0894841775 * a - 1.291485548 * b;

  const l3 = lp ** 3;
  const m3 = mp ** 3;
  const s3 = sp ** 3;

  const clamp = (n) => Math.min(1, Math.max(0, n));
  return {
    r: clamp(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    g: clamp(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    b: clamp(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
    alpha,
  };
}

const encode = (n) =>
  n <= 0.0031308 ? 12.92 * n : 1.055 * n ** (1 / 2.4) - 0.055;
const decode = (n) =>
  n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;

/** OKLCH -> `#rrggbb`, or `#rrggbbaa` when the colour carries alpha. */
export function oklchToHex(value) {
  const { r, g, b, alpha } = oklchToLinearSrgb(value);
  const byte = (n) =>
    Math.round(Math.min(255, Math.max(0, encode(n) * 255)))
      .toString(16)
      .padStart(2, "0");
  const rgb = `#${byte(r)}${byte(g)}${byte(b)}`;
  return alpha === 1
    ? rgb
    : `${rgb}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

/**
 * Composite a possibly-translucent colour over an opaque backdrop.
 * Blending happens in gamma-encoded sRGB, matching what browsers do, and the
 * result comes back as linear-light so luminance can be read straight off it.
 */
export function compositeOver(foreground, backdrop) {
  const fg = oklchToLinearSrgb(foreground);
  const bg = oklchToLinearSrgb(backdrop);
  if (fg.alpha === 1) return fg;
  const mix = (f, b) => decode(encode(f) * fg.alpha + encode(b) * (1 - fg.alpha));
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), alpha: 1 };
}

/** WCAG 2.1 relative luminance from linear-light sRGB. */
export function luminance({ r, g, b }) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two colours, each composited over `backdrop`
 * first so translucent tints and hairlines are measured as they actually render.
 */
export function contrastRatio(foreground, background, backdrop = background) {
  const fg = luminance(compositeOver(foreground, backdrop));
  const bg = luminance(compositeOver(background, backdrop));
  const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg];
  return (hi + 0.05) / (lo + 0.05);
}
