// Key a flat or checkerboard background out of a sprite sheet.
//
// The background is auto-detected from the image border:
//   - "checker": a baked-in transparency checkerboard (neutral light pixels)
//   - "dark":    a flat dark background
//   - "flat":    any other flat colour (sampled from the border)
//
// Removal is a border flood fill, so enclosed whites (eyes, glyphs, glasses)
// and dark interiors (hair, outlines) survive.
//
//   node scripts/key-bg.mjs <in.png> [out.png] [tolerance=16]

import sharp from "sharp";

const [input, outArg, tolArg] = process.argv.slice(2);
if (!input) {
  console.error("usage: node scripts/key-bg.mjs <in.png> [out.png] [tolerance=16]");
  process.exit(1);
}
const output = outArg ?? input;
const tolerance = Number(tolArg ?? 16);

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

// ---- detect the background from the border ---------------------------------
// Sampled a few pixels INSET, so a thin frame line on the outermost pixels
// (some generators add one) doesn't skew the detection.
const INSET = Math.min(6, Math.floor(Math.min(w, h) / 20));
let sr = 0;
let sg = 0;
let sb = 0;
let samples = 0;
let neutralLight = 0;
const sample = (x, y) => {
  const i = (y * w + x) * 4;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  sr += r;
  sg += g;
  sb += b;
  samples += 1;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  if (spread <= 18 && (r + g + b) / 3 >= 165) neutralLight += 1;
};
for (let x = INSET; x < w - INSET; x += 2) {
  sample(x, INSET);
  sample(x, h - 1 - INSET);
}
for (let y = INSET; y < h - INSET; y += 2) {
  sample(INSET, y);
  sample(w - 1 - INSET, y);
}
const bg = [sr / samples, sg / samples, sb / samples];
const neutralRatio = neutralLight / samples;
const brightness = (bg[0] + bg[1] + bg[2]) / 3;

let mode;
if (neutralRatio >= 0.8) mode = "checker";
else if (brightness < 60) mode = "dark";
else mode = "flat";

const isBg = (p) => {
  const i = p * 4;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (mode === "checker") {
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    return spread <= 16 && (r + g + b) / 3 >= 170;
  }
  return (
    Math.abs(r - bg[0]) <= tolerance &&
    Math.abs(g - bg[1]) <= tolerance &&
    Math.abs(b - bg[2]) <= tolerance
  );
};

// ---- border flood fill -----------------------------------------------------
const seen = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x += 1) stack.push(x, 0, x, h - 1);
for (let y = 0; y < h; y += 1) stack.push(0, y, w - 1, y);

let removed = 0;
while (stack.length) {
  const y = stack.pop();
  const x = stack.pop();
  const p = y * w + x;
  if (seen[p] || !isBg(p)) continue;
  seen[p] = 1;
  data[p * 4 + 3] = 0;
  removed += 1;
  if (x > 0) stack.push(x - 1, y);
  if (x < w - 1) stack.push(x + 1, y);
  if (y > 0) stack.push(x, y - 1);
  if (y < h - 1) stack.push(x, y + 1);
}

await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(output);
console.log(
  JSON.stringify({
    input,
    output,
    mode,
    background: bg.map((v) => Math.round(v)),
    neutralRatio: +neutralRatio.toFixed(2),
    removed,
    removedPct: +((100 * removed) / (w * h)).toFixed(1),
  })
);
