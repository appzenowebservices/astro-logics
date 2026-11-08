// Measure a sprite sheet for the AR page: grid size, how many cells actually
// contain art, and the character's content box inside a cell (from the alpha
// channel). Paste the printed `crop` / `frames` into src/ar/assets/*.js.
//
//   node scripts/measure-sprite.mjs public/sprite/nischal-idle-trimmed.png [cols] [rows]

import sharp from "sharp";

const [file, colsArg, rowsArg] = process.argv.slice(2);
if (!file) {
  console.error("usage: node scripts/measure-sprite.mjs <sheet.png> [cols=5] [rows=5]");
  process.exit(1);
}
const cols = Number(colsArg ?? 5);
const rows = Number(rowsArg ?? 5);

const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const cellW = width / cols;
const cellH = height / rows;

let x0 = cellW;
let y0 = cellH;
let x1 = -1;
let y1 = -1;
const used = [];

for (let r = 0; r < rows; r += 1) {
  for (let c = 0; c < cols; c += 1) {
    let any = false;
    for (let y = Math.floor(r * cellH); y < Math.floor((r + 1) * cellH); y += 1) {
      for (let x = Math.floor(c * cellW); x < Math.floor((c + 1) * cellW); x += 1) {
        if (data[(y * width + x) * 4 + 3] > 8) {
          any = true;
          const lx = x - c * cellW;
          const ly = y - r * cellH;
          if (lx < x0) x0 = lx;
          if (ly < y0) y0 = ly;
          if (lx > x1) x1 = lx;
          if (ly > y1) y1 = ly;
        }
      }
    }
    used.push(any ? 1 : 0);
  }
}

const frames = used.filter(Boolean).length;
console.log(
  JSON.stringify(
    {
      file,
      sheet: `${width}x${height}`,
      cell: `${cellW}x${cellH}`,
      cols,
      rows,
      frames,
      grid: used.join(""),
      crop: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 },
    },
    null,
    2
  )
);
