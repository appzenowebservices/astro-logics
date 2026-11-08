// The AR character: Nischal, hand-drawn sprite sheets (public/sprite/).
// 5x5 grid of 256 px cells; `crop` is the character's content box inside a
// cell (measured from the alpha channel), so frames can be UV-mapped tightly
// and the feet land exactly on the ground plane.

export const NISCHAL = {
  name: "Nischal",
  source: "nischal",
  idle: {
    url: "/sprite/nischal-idle-trimmed.png",
    cols: 5,
    rows: 5,
    frames: 24,
    fps: 8,
    crop: { x: 70, y: 15, w: 103, h: 228 },
  },
  walk: {
    url: "/sprite/nischal-walk-trimmed.png",
    cols: 5,
    rows: 5,
    frames: 22,
    fps: 12,
    crop: { x: 79, y: 33, w: 87, h: 191 },
  },
  dance: {
    url: "/sprite/nischal-dance-trimmed.png",
    cols: 5,
    rows: 5,
    frames: 25,
    fps: 12,
    crop: { x: 53, y: 11, w: 109, h: 186 },
  },
};
