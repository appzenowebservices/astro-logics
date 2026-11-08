// Virgo — the green hooded bean from character-idle.png (public/sprite/).
// 5x5 grid, 25 frames, idle loop with expressions (glyph face → blinks/winks).
// Already keyed to transparency with scripts/key-bg.mjs (baked checkerboard).

export const VIRGO = {
  name: "Virgo",
  source: "virgo",
  idle: {
    url: "/sprite/character-idle.png",
    cols: 5,
    rows: 5,
    frames: 25,
    fps: 10,
    crop: { x: 32, y: 10, w: 137, h: 177 },
  },
};
