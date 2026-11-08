// Built-in 2D character sprite sheet, generated at runtime so the AR page
// ships with an animated asset and zero binary payload. Layout:
//   row 0 -> idle (4 frames), row 1 -> walk (8 frames).

export const SAMPLE_FRAME_W = 128;
export const SAMPLE_FRAME_H = 192;

const IDLE_FRAMES = 4;
const WALK_FRAMES = 8;
const COLS = WALK_FRAMES;
const ROWS = 2;

const SUIT = "#1d2a4a";
const SUIT_DARK = "#141d33";
const PANTS = "#101830";
const SKIN = "#f2c894";
const HAIR = "#ae3f29";
const SHIRT = "#ffe9b8";
const TIE = "#f6ad3f";
const SHOE = "#0b1020";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function limb(ctx, x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawFrame(ctx, w, h, t, mode) {
  const S = h / SAMPLE_FRAME_H;
  const cx = w / 2;
  const cycle = t * Math.PI * 2;
  const walking = mode === "walk";

  const liftL = walking ? Math.max(0, Math.sin(cycle)) * 15 * S : 0;
  const liftR = walking ? Math.max(0, -Math.sin(cycle)) * 15 * S : 0;
  const armL = walking ? -Math.sin(cycle) * 24 * S : Math.sin(cycle) * 3 * S;
  const armR = walking ? Math.sin(cycle) * 24 * S : -Math.sin(cycle) * 3 * S;
  const bob = walking ? -Math.abs(Math.sin(cycle * 2)) * 2.5 * S : -Math.sin(cycle) * 1.2 * S;

  const groundY = h * 0.94;
  const hipY = h * 0.6 + bob;
  const shY = h * 0.33 + bob;
  const headR = 21 * S;
  const headCy = h * 0.155 + bob;
  const torsoW = 36 * S;

  // back arm
  limb(ctx, cx - 13 * S, shY + 8 * S, cx - 15 * S + armL * 0.8, shY + 42 * S - Math.abs(armL) * 0.2, 9 * S, SUIT_DARK);

  // legs (behind the jacket hem)
  limb(ctx, cx - 8 * S, hipY, cx - 10 * S, groundY - liftL, 12 * S, PANTS);
  limb(ctx, cx + 8 * S, hipY, cx + 10 * S, groundY - liftR, 12 * S, PANTS);
  ctx.fillStyle = SHOE;
  for (const [fx, lift] of [[cx - 10 * S, liftL], [cx + 10 * S, liftR]]) {
    ctx.beginPath();
    ctx.ellipse(fx, groundY - lift - 3 * S, 9 * S, 4.5 * S, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // torso jacket
  ctx.fillStyle = SUIT;
  roundRect(ctx, cx - torsoW / 2, shY, torsoW, hipY - shY + 12 * S, 11 * S);
  ctx.fill();

  // shirt + tie
  ctx.fillStyle = SHIRT;
  ctx.beginPath();
  ctx.moveTo(cx - 10 * S, shY);
  ctx.lineTo(cx + 10 * S, shY);
  ctx.lineTo(cx, shY + 20 * S);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = TIE;
  ctx.beginPath();
  ctx.moveTo(cx - 3 * S, shY + 6 * S);
  ctx.lineTo(cx + 3 * S, shY + 6 * S);
  ctx.lineTo(cx, shY + 30 * S);
  ctx.closePath();
  ctx.fill();

  // head
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx, headCy + 2 * S, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.arc(cx, headCy, headR, Math.PI * 1.02, Math.PI * 1.98);
  ctx.closePath();
  ctx.fill();

  // face
  const blink = !walking && Math.floor(t * 4) % 4 === 3;
  ctx.strokeStyle = "#141d33";
  ctx.lineWidth = 2.4 * S;
  ctx.lineCap = "round";
  if (blink) {
    ctx.beginPath();
    ctx.moveTo(cx - 9 * S, headCy + 7 * S);
    ctx.lineTo(cx - 3 * S, headCy + 7 * S);
    ctx.moveTo(cx + 3 * S, headCy + 7 * S);
    ctx.lineTo(cx + 9 * S, headCy + 7 * S);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#141d33";
    ctx.beginPath();
    ctx.arc(cx - 6 * S, headCy + 7 * S, 2.4 * S, 0, Math.PI * 2);
    ctx.arc(cx + 6 * S, headCy + 7 * S, 2.4 * S, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, headCy + 12 * S, 5 * S, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  // front arm
  limb(ctx, cx + 13 * S, shY + 8 * S, cx + 15 * S + armR * 0.8, shY + 42 * S - Math.abs(armR) * 0.2, 9 * S, SUIT);
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx + 15 * S + armR * 0.8, shY + 44 * S - Math.abs(armR) * 0.2, 5 * S, 0, Math.PI * 2);
  ctx.fill();
}

export function createSampleSheet() {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_FRAME_W * COLS;
  canvas.height = SAMPLE_FRAME_H * ROWS;
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < IDLE_FRAMES; i += 1) {
    ctx.save();
    ctx.translate(i * SAMPLE_FRAME_W, 0);
    drawFrame(ctx, SAMPLE_FRAME_W, SAMPLE_FRAME_H, i / IDLE_FRAMES, "idle");
    ctx.restore();
  }

  for (let i = 0; i < WALK_FRAMES; i += 1) {
    ctx.save();
    ctx.translate(i * SAMPLE_FRAME_W, SAMPLE_FRAME_H);
    drawFrame(ctx, SAMPLE_FRAME_W, SAMPLE_FRAME_H, i / WALK_FRAMES, "walk");
    ctx.restore();
  }

  return {
    url: canvas.toDataURL("image/png"),
    cols: COLS,
    rows: ROWS,
    frameWidth: SAMPLE_FRAME_W,
    frameHeight: SAMPLE_FRAME_H,
    idle: { row: 0, frames: IDLE_FRAMES, fps: 4 },
    walk: { row: 1, frames: WALK_FRAMES, fps: 12 },
    name: "Built-in sample",
    source: "sample",
  };
}

/** Build a sheet descriptor from a user-uploaded PNG sprite sheet. */
export function buildUploadedSheet(url, name, width, height, cfg) {
  const cols = Math.max(1, Math.round(cfg.cols));
  const rows = Math.max(1, Math.round(cfg.rows));
  const fps = Math.max(1, Math.round(cfg.fps));
  return {
    url,
    cols,
    rows,
    frameWidth: width / cols,
    frameHeight: height / rows,
    idle: { row: 0, frames: cols, fps },
    walk: { row: rows >= 2 ? 1 : 0, frames: cols, fps: Math.min(24, fps * 2) },
    name,
    source: "upload",
  };
}
