#!/usr/bin/env node
/*
 * hex-to-oklch.js
 *
 * What this does
 * --------------
 * Converts sRGB hex color literals to OKLCH primitives (L%, C, H).
 * Prints them in the `--lch-<name>: L% C H;` shape used by `css/colors.css`.
 *
 * Why this exists
 * ---------------
 * Converts the original hex-based color system to OKLCH
 * primitives + semantic tokens, mirroring charity calc's pattern. Doing the
 * conversion by hand (or via copy-paste into oklch.com) is tedious and
 * error-prone, and the sRGB → linear RGB → Oklab → OKLCH pipeline is short
 * enough to live in a self-contained script with no dependencies.
 *
 * This script has no runtime impact — it's only used once (or whenever the
 * palette changes) to regenerate the `--lch-*` custom properties that
 * `css/colors.css` then wraps in `oklch(...)` as semantic tokens.
 *
 * How to run
 * ----------
 *   node scripts/hex-to-oklch.js
 *
 * Reference
 * ---------
 * Björn Ottosson's Oklab post: https://bottosson.github.io/posts/oklab/
 */

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToOklab(r, g, b) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function oklabToLch(L, a, b) {
  const C = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [L, C, h];
}

function hexToOklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  const [L, A, B] = linearToOklab(r, g, b);
  const [Ll, C, H] = oklabToLch(L, A, B);
  return `${(Ll * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)}`;
}

// The current palette from the original inline <style> in index.html.
// Add/remove entries here to regenerate the primitives when the palette changes.
const colors = {
  "bg-deep": "#0f1a2e",
  "bg-mid": "#162240",
  "text-primary": "#e8ddd0",
  "text-secondary": "#8a9bb5",
  "text-dim": "#546380",
  "accent-warm": "#d4a574",
  "accent-glow": "#e8c9a0",
  "accent-breath": "#7ba5c4",
};

for (const [name, hex] of Object.entries(colors)) {
  console.log(`--lch-${name.padEnd(16)} ${hexToOklch(hex)};  /* was ${hex} */`);
}
