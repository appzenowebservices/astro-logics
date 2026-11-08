// High-detail voxel characters — LEGO-ish builders assembled from hundreds of
// boxes, merged per body part (head / torso / arms / legs). Faces are split:
// static detail (brows, nose, lips, cheeks, hair, glasses) merges into the
// head, while eyes and the mouth are separate meshes so the component can
// blink and talk.

import * as THREE from "three";

function shade(hex, amount) {
  const color = new THREE.Color(hex);
  color.lerp(new THREE.Color(amount >= 0 ? "#ffffff" : "#000000"), Math.abs(amount));
  return `#${color.getHexString()}`;
}

export const DETAILED_CHARACTERS = {
  explorer: {
    name: "Voxel · Explorer",
    skin: "#e8b98a",
    skinDark: "#d9a877",
    skinLight: "#f2cd9f",
    hair: "#6b4a2a",
    hairLight: "#8a6238",
    hairDark: "#523722",
    hairStyle: "curly",
    brow: "#523722",
    eye: "#3a5a7a",
    glasses: "#5a3a22",
    lens: "#bcd8e8",
    jacket: "#8d8d62",
    jacketDark: "#6f6f4c",
    jacketLight: "#a3a375",
    shirt: "#cfe3f0",
    pants: "#7a7a52",
    pantsDark: "#5f5f42",
    pantsLight: "#8f8f63",
    boots: "#7a4a24",
    bootDark: "#5f3a1c",
    sole: "#3f2a14",
    belt: "#4a3a22",
    blush: "#d98a7a",
    freckles: true,
    backpack: true,
    packColor: "#5f6f4a",
    packDark: "#4a5a3a",
    bedroll: "#4f7a4a",
    speed: 1,
    face: { eyeX: 0.075, eyeY: 0.17, eyeW: 0.1, eyeH: 0.085, mouthY: 0.048, mouthW: 0.085 },
  },
  curly: {
    name: "Voxel · Curly",
    skin: "#b57a4a",
    skinDark: "#9f6a3d",
    skinLight: "#c98d5c",
    hair: "#151515",
    hairDark: "#0c0c0c",
    hairStyle: "curlyShort",
    brow: "#1d1d1d",
    eye: "#2a1a10",
    jacket: "#3b6fb5",
    jacketDark: "#2c558c",
    jacketLight: "#4f83c9",
    shirt: "#f8f4ea",
    pants: "#2f4260",
    pantsDark: "#26364e",
    pantsLight: "#3b5074",
    boots: "#2a2a2a",
    bootDark: "#1d1d1d",
    sole: "#171717",
    belt: "#1f2a3a",
    blush: "#c97a5a",
    stubble: true,
    speed: 1,
    face: { eyeX: 0.075, eyeY: 0.17, eyeW: 0.1, eyeH: 0.085, mouthY: 0.048, mouthW: 0.082 },
  },
  beanie: {
    name: "Voxel · Beanie",
    skin: "#e0aa78",
    skinDark: "#c9925f",
    skinLight: "#ecc08d",
    hair: "#c96a2a",
    hairDark: "#a54f1e",
    hairStyle: "beanie",
    beanie: "#4a7a3a",
    beanieDark: "#3a6230",
    beanieLight: "#5f9350",
    brow: "#a54f1e",
    eye: "#2a1a10",
    beard: "#c96a2a",
    beardDark: "#a54f1e",
    jacket: "#a8452f",
    jacketDark: "#87352a",
    jacketLight: "#c05a3f",
    shirt: "#e8d9b8",
    pants: "#4a5a3a",
    pantsDark: "#3a4a2e",
    pantsLight: "#5a6a48",
    boots: "#3a2a1a",
    bootDark: "#2a1e12",
    sole: "#241a10",
    belt: "#2f2a1a",
    blush: "#c98a6a",
    speed: 0.95,
    face: { eyeX: 0.075, eyeY: 0.17, eyeW: 0.095, eyeH: 0.08, mouthY: 0.044, mouthW: 0.078 },
  },
  flora: {
    name: "Voxel · Flora",
    skin: "#f2c9a0",
    skinDark: "#e0b088",
    skinLight: "#f8d9b8",
    hair: "#f2d24a",
    hairLight: "#f8e27a",
    hairDark: "#d9b232",
    hairStyle: "flowerHair",
    brow: "#d9b232",
    eye: "#3a7a4a",
    jacket: "#e87ab5",
    jacketDark: "#c95f98",
    jacketLight: "#f2a0cc",
    shirt: "#fff2f8",
    pants: "#7ab5e8",
    pantsDark: "#5f9ac9",
    pantsLight: "#94c5ee",
    boots: "#c95f98",
    bootDark: "#a5457a",
    sole: "#8a3a68",
    belt: "#f2d24a",
    blush: "#f2a0a0",
    lashes: true,
    speed: 0.95,
    face: { eyeX: 0.072, eyeY: 0.17, eyeW: 0.105, eyeH: 0.095, mouthY: 0.046, mouthW: 0.082 },
  },
  cyborg: {
    name: "Voxel · Cyborg",
    skin: "#8a9aa8",
    skinDark: "#7a8a98",
    skinLight: "#9aa8b5",
    hairStyle: "helmet",
    helmet: "#9aa8b5",
    helmetDark: "#7a8a98",
    helmetLight: "#b5c1cc",
    eye: "#5eead4",
    jacket: "#4a5a6a",
    jacketDark: "#3a4a5a",
    jacketLight: "#5f7285",
    shirt: "#2a3540",
    pants: "#3a4a5a",
    pantsDark: "#2f3d4a",
    pantsLight: "#4a5a6a",
    boots: "#2a3540",
    bootDark: "#1a2330",
    sole: "#1a2330",
    belt: "#1f2a36",
    style: "armor",
    glow: { visor: "#5eead4", core: "#5eead4" },
    speed: 1,
    face: null,
  },
};

/* ------------------------------------------------------------------ */
/* head (static detail; eyes + mouth are dynamic meshes)              */
/* ------------------------------------------------------------------ */

function buildHead(cfg) {
  const b = [];
  const add = (p, s, c) => b.push({ p, s, c });
  const skin = cfg.skin;
  const skinDark = cfg.skinDark ?? skin;
  const skinLight = cfg.skinLight ?? skin;
  const hair = cfg.hair ?? "#3a2a1a";
  const helmeted = cfg.hairStyle === "helmet";
  const f = cfg.face;

  // skull + shading
  add([0, 0.16, 0], [0.34, 0.34, 0.32], skin);
  add([-0.165, 0.16, 0], [0.02, 0.3, 0.28], skinDark);
  add([0.165, 0.16, 0], [0.02, 0.3, 0.28], skinDark);
  add([0, 0.14, -0.17], [0.34, 0.32, 0.02], skinDark);
  add([0, 0.005, 0.02], [0.3, 0.03, 0.26], skinDark);
  add([0, -0.006, 0.11], [0.13, 0.03, 0.07], skinLight);

  // ears
  for (const sx of [-1, 1]) {
    add([sx * 0.185, 0.14, 0], [0.05, 0.1, 0.07], skin);
    add([sx * 0.19, 0.14, 0], [0.02, 0.05, 0.04], skinDark);
  }

  if (!helmeted && f) {
    // eye sockets (depth around the dynamic eyes)
    add([-f.eyeX, f.eyeY, 0.155], [f.eyeW + 0.02, f.eyeH + 0.02, 0.015], skinDark);
    add([f.eyeX, f.eyeY, 0.155], [f.eyeW + 0.02, f.eyeH + 0.02, 0.015], skinDark);
    // brows
    if (!cfg.glasses) {
      add([-f.eyeX, f.eyeY + 0.058, 0.172], [f.eyeW + 0.015, 0.026, 0.02], cfg.brow ?? hair);
      add([f.eyeX, f.eyeY + 0.058, 0.172], [f.eyeW + 0.015, 0.026, 0.02], cfg.brow ?? hair);
    }
    // lashes
    if (cfg.lashes) {
      add([-f.eyeX - 0.045, f.eyeY - 0.01, 0.175], [0.03, 0.05, 0.015], "#3a2a1a");
      add([f.eyeX + 0.045, f.eyeY - 0.01, 0.175], [0.03, 0.05, 0.015], "#3a2a1a");
    }
    // nose
    add([0, 0.12, 0.17], [0.06, 0.075, 0.045], skin);
    add([0, 0.148, 0.19], [0.03, 0.028, 0.02], skinLight);
    add([-0.026, 0.1, 0.186], [0.02, 0.02, 0.015], skinDark);
    add([0.026, 0.1, 0.186], [0.02, 0.02, 0.015], skinDark);
    // lips frame (the cavity itself is dynamic)
    const lip = cfg.lip ?? shade(skin, -0.14);
    add([-f.mouthW / 2 - 0.01, f.mouthY, 0.168], [0.016, 0.05, 0.016], lip);
    add([f.mouthW / 2 + 0.01, f.mouthY, 0.168], [0.016, 0.05, 0.016], lip);
    add([0, f.mouthY + 0.026, 0.168], [f.mouthW, 0.016, 0.016], lip);
    add([0, f.mouthY - 0.026, 0.168], [f.mouthW, 0.016, 0.016], lip);
    // cheeks + freckles
    add([-0.12, f.mouthY + 0.062, 0.162], [0.05, 0.032, 0.012], cfg.blush ?? "#d98a7a");
    add([0.12, f.mouthY + 0.062, 0.162], [0.05, 0.032, 0.012], cfg.blush ?? "#d98a7a");
    if (cfg.freckles) {
      for (const [x, y] of [[-0.13, 0.1], [-0.105, 0.085], [-0.135, 0.07], [0.13, 0.1], [0.105, 0.085], [0.135, 0.07]]) {
        add([x, y, 0.164], [0.012, 0.012, 0.008], shade(skin, -0.16));
      }
    }
    if (cfg.stubble) {
      for (const [x, y] of [[-0.1, 0.02], [0, -0.01], [0.1, 0.02], [-0.14, 0.06], [0.14, 0.06]]) {
        add([x, y, 0.15], [0.08, 0.05, 0.04], "#243024");
      }
      add([0, 0.045, 0.165], [0.14, 0.02, 0.02], "#243024");
    }
  }

  // glasses (thin frames; lenses are transparent meshes in the component)
  if (cfg.glasses) {
    const fr = 0.018;
    for (const sx of [-1, 1]) {
      const x = sx * f.eyeX;
      add([x, f.eyeY + 0.052, 0.185], [f.eyeW + 0.02, fr, 0.018], cfg.glasses);
      add([x, f.eyeY - 0.055, 0.185], [f.eyeW + 0.02, fr, 0.018], cfg.glasses);
      add([x - sx * (f.eyeW / 2 + 0.012), f.eyeY, 0.185], [fr, f.eyeH + 0.09, 0.018], cfg.glasses);
      add([x + sx * (f.eyeW / 2 + 0.012), f.eyeY, 0.185], [fr, f.eyeH + 0.09, 0.018], cfg.glasses);
    }
    add([0, f.eyeY + 0.02, 0.185], [0.03, fr, 0.018], cfg.glasses);
    add([-0.165, 0.2, 0.05], [0.018, 0.018, 0.27], cfg.glasses);
    add([0.165, 0.2, 0.05], [0.018, 0.018, 0.27], cfg.glasses);
  }

  // hair styles
  if (cfg.hairStyle === "curly") {
    const light = cfg.hairLight ?? hair;
    const dark = cfg.hairDark ?? hair;
    // rounded cap hugging the skull
    add([0, 0.315, -0.01], [0.37, 0.1, 0.35], hair);
    add([0, 0.26, -0.175], [0.36, 0.18, 0.04], dark);
    add([-0.185, 0.24, -0.01], [0.04, 0.2, 0.33], hair);
    add([0.185, 0.24, -0.01], [0.04, 0.2, 0.33], hair);
    add([0, 0.35, 0.05], [0.3, 0.05, 0.24], light);
    const curls = [];
    for (let i = 0; i < 7; i += 1) {
      curls.push([-0.135 + i * 0.045, 0.375 + (i % 2) * 0.015, 0.04 + (i % 3) * 0.05]);
    }
    for (let i = 0; i < 5; i += 1) {
      curls.push([-0.12 + i * 0.06, 0.345, 0.15]);
    }
    for (const [x, y] of [[-0.17, 0.33], [-0.17, 0.28], [0.17, 0.33], [0.17, 0.28]]) {
      curls.push([x, y, 0.1]);
    }
    curls.forEach((p, i) =>
      add(p, [0.07, 0.07, 0.07], i % 3 === 0 ? light : i % 3 === 1 ? hair : dark)
    );
    add([-0.175, 0.16, 0.06], [0.035, 0.1, 0.06], hair);
    add([0.175, 0.16, 0.06], [0.035, 0.1, 0.06], hair);
  } else if (cfg.hairStyle === "curlyShort") {
    add([0, 0.32, -0.01], [0.38, 0.11, 0.36], hair);
    add([0, 0.26, -0.18], [0.36, 0.16, 0.04], cfg.hairDark ?? hair);
    add([0, 0.36, 0.05], [0.3, 0.05, 0.24], shade(hair, 0.08));
    const curls = [
      [-0.13, 0.375, 0.06], [-0.02, 0.39, 0.05], [0.09, 0.375, 0.06],
      [-0.145, 0.35, 0.14], [0.045, 0.36, 0.15], [-0.06, 0.36, 0.155],
      [-0.17, 0.33, -0.04], [0.17, 0.33, -0.04], [-0.175, 0.29, 0.06], [0.175, 0.29, 0.06],
    ];
    curls.forEach((p) => add(p, [0.07, 0.07, 0.07], hair));
    add([-0.175, 0.16, 0.06], [0.035, 0.1, 0.06], hair);
    add([0.175, 0.16, 0.06], [0.035, 0.1, 0.06], hair);
  } else if (cfg.hairStyle === "beanie") {
    const beanie = cfg.beanie;
    const dark = cfg.beanieDark ?? beanie;
    const light = cfg.beanieLight ?? beanie;
    add([0, 0.34, 0], [0.36, 0.12, 0.34], beanie);
    add([0, 0.41, 0], [0.28, 0.08, 0.26], light);
    for (let i = 0; i < 8; i += 1) {
      const x = -0.15 + i * 0.043;
      add([x, 0.34, 0.172], [0.032, 0.11, 0.02], i % 2 ? dark : beanie);
    }
    add([0, 0.29, 0], [0.38, 0.06, 0.36], dark);
    add([0, 0.255, 0.172], [0.38, 0.04, 0.02], light);
    add([0, 0.22, -0.175], [0.34, 0.1, 0.04], hair);
    add([-0.16, 0.19, 0.13], [0.06, 0.1, 0.05], hair);
    add([0.16, 0.19, 0.13], [0.06, 0.1, 0.05], hair);
    add([-0.185, 0.16, 0.02], [0.04, 0.1, 0.06], hair);
    add([0.185, 0.16, 0.02], [0.04, 0.1, 0.06], hair);
    if (cfg.beard && f) {
      const beard = cfg.beard;
      const dark2 = cfg.beardDark ?? beard;
      const spots = [
        [-0.1, 0.06, 0.15, 0], [0, 0.02, 0.16, 1], [0.1, 0.06, 0.15, 0],
        [-0.15, 0.04, 0.09, 1], [0.15, 0.04, 0.09, 1],
        [-0.12, 0.0, 0.12, 0], [0.12, 0.0, 0.12, 0], [0, -0.01, 0.15, 1],
        [-0.08, -0.035, 0.13, 0], [0.08, -0.035, 0.13, 0], [0, -0.05, 0.14, 1],
        [-0.05, -0.075, 0.115, 0], [0.05, -0.075, 0.115, 0],
        [-0.13, 0.09, 0.08, 1], [0.13, 0.09, 0.08, 1],
      ];
      spots.forEach(([x, y, z, alt]) => add([x, y, z], [0.085, 0.07, 0.055], alt ? dark2 : beard));
      add([-0.055, 0.085, 0.168], [0.07, 0.028, 0.03], beard);
      add([0.055, 0.085, 0.168], [0.07, 0.028, 0.03], beard);
      add([0, 0.07, 0.172], [0.04, 0.02, 0.02], dark2);
    }
  } else if (cfg.hairStyle === "flowerHair") {
    const light = cfg.hairLight ?? hair;
    const dark = cfg.hairDark ?? hair;
    add([0, 0.315, -0.01], [0.38, 0.11, 0.36], hair);
    add([0, 0.24, -0.18], [0.38, 0.22, 0.06], dark);
    add([-0.2, 0.2, -0.01], [0.05, 0.26, 0.32], hair);
    add([0.2, 0.2, -0.01], [0.05, 0.26, 0.32], hair);
    add([0, 0.36, 0.05], [0.3, 0.05, 0.24], light);
    add([-0.13, 0.31, 0.16], [0.1, 0.09, 0.04], hair);
    add([0, 0.32, 0.17], [0.11, 0.08, 0.04], light);
    add([0.13, 0.31, 0.16], [0.1, 0.09, 0.04], hair);
    for (let i = 0; i < 4; i += 1) {
      add([-0.215, 0.1 - i * 0.08, 0.05], [0.04, 0.06, 0.2], i % 2 ? light : hair);
      add([0.215, 0.1 - i * 0.08, 0.05], [0.04, 0.06, 0.2], i % 2 ? light : hair);
    }
    const flowers = [
      [-0.17, 0.37, 0.1, "#f27ab5"], [-0.06, 0.42, 0.04, "#7ab5f2"],
      [0.15, 0.37, -0.06, "#f2d24a"], [0.21, 0.27, 0.08, "#f27ab5"],
      [-0.2, 0.24, -0.08, "#7ab5f2"], [0.06, 0.42, 0.12, "#f27ab5"],
    ];
    flowers.forEach(([x, y, z, c]) => {
      add([x, y, z], [0.08, 0.08, 0.08], c);
      add([x + 0.028, y + 0.028, z + 0.028], [0.04, 0.04, 0.04], "#fff2f8");
      add([x - 0.03, y - 0.03, z], [0.03, 0.03, 0.03], shade(c, -0.15));
    });
    for (let i = 0; i < 7; i += 1) {
      add([0.2, 0.02 - i * 0.09, 0.0], [0.08, 0.08, 0.08], i % 2 ? dark : hair);
    }
    add([0.2, -0.63, 0.0], [0.08, 0.06, 0.08], "#f27ab5");
    add([0.15, -0.62, 0.03], [0.04, 0.04, 0.04], "#f27ab5");
    add([0.25, -0.62, 0.03], [0.04, 0.04, 0.04], "#f27ab5");
  } else if (helmeted) {
    const helm = cfg.helmet;
    const dark = cfg.helmetDark ?? helm;
    const light = cfg.helmetLight ?? helm;
    add([0, 0.34, -0.02], [0.38, 0.16, 0.36], helm);
    add([0, 0.4, 0.02], [0.32, 0.06, 0.3], light);
    add([0, 0.22, -0.175], [0.38, 0.26, 0.06], dark);
    add([-0.2, 0.16, -0.02], [0.05, 0.3, 0.34], dark);
    add([0.2, 0.16, -0.02], [0.05, 0.3, 0.34], dark);
    add([-0.22, 0.16, 0], [0.035, 0.12, 0.12], "#3a4a5a");
    add([0.22, 0.16, 0], [0.035, 0.12, 0.12], "#3a4a5a");
    add([-0.24, 0.16, 0], [0.02, 0.06, 0.06], "#5eead4");
    add([0.24, 0.16, 0], [0.02, 0.06, 0.06], "#5eead4");
    add([0, 0.26, 0.172], [0.34, 0.02, 0.015], dark);
    add([0, 0.34, 0.185], [0.3, 0.02, 0.012], dark);
    add([0, 0.04, 0.145], [0.26, 0.1, 0.06], dark);
    add([-0.08, 0.02, 0.178], [0.03, 0.02, 0.02], "#2a3540");
    add([0, 0.02, 0.178], [0.03, 0.02, 0.02], "#2a3540");
    add([0.08, 0.02, 0.178], [0.03, 0.02, 0.02], "#2a3540");
    add([0, 0.38, -0.19], [0.06, 0.08, 0.05], dark);
    add([0, 0.44, -0.2], [0.03, 0.05, 0.03], "#5eead4");
  }

  return b;
}

/* ------------------------------------------------------------------ */
/* torso / arms / legs                                                 */
/* ------------------------------------------------------------------ */

function buildTorso(cfg) {
  const b = [];
  const add = (p, s, c) => b.push({ p, s, c });
  const jacket = cfg.jacket;
  const dark = cfg.jacketDark ?? jacket;
  const light = cfg.jacketLight ?? jacket;

  add([0, 0.6, 0], [0.12, 0.08, 0.12], cfg.skin);
  add([0, 0.6, -0.01], [0.12, 0.06, 0.1], cfg.skinDark ?? cfg.skin);

  // jacket panels (shaded grid)
  const cols = [-0.115, 0.115];
  const rows = [[0.44, 0.24, jacket], [0.22, 0.22, dark], [0.44, 0.1, light]];
  add([0, 0.29, 0], [0.46, 0.58, 0.3], jacket);
  cols.forEach((x) => {
    rows.forEach(([y, h, c]) => add([x, y, 0.152], [0.21, h, 0.015], shade(c, x > 0 ? 0.04 : -0.03)));
  });
  add([-0.23, 0.29, 0], [0.02, 0.54, 0.26], dark);
  add([0.23, 0.29, 0], [0.02, 0.54, 0.26], dark);
  add([0, 0.585, 0], [0.46, 0.03, 0.3], light);
  add([0, 0.045, 0], [0.46, 0.03, 0.3], dark);

  // collar
  add([-0.11, 0.585, 0.1], [0.15, 0.05, 0.1], light);
  add([0.11, 0.585, 0.1], [0.15, 0.05, 0.1], light);
  add([-0.15, 0.56, 0.05], [0.05, 0.08, 0.18], dark);
  add([0.15, 0.56, 0.05], [0.05, 0.08, 0.18], dark);
  add([0, 0.5, 0.12], [0.16, 0.22, 0.02], cfg.shirt ?? "#e8e8e8");

  // zipper teeth + pull
  for (let i = 0; i < 6; i += 1) {
    add([0, 0.42 - i * 0.07, 0.158], [0.028, 0.03, 0.02], i % 2 ? light : dark);
  }
  add([0.025, 0.19, 0.16], [0.03, 0.045, 0.02], "#f2c94c");
  add([0.025, 0.16, 0.16], [0.02, 0.02, 0.02], dark);

  // chest pocket + pen
  add([-0.13, 0.45, 0.158], [0.13, 0.11, 0.02], light);
  add([-0.13, 0.505, 0.16], [0.13, 0.025, 0.02], dark);
  add([-0.1, 0.49, 0.163], [0.02, 0.05, 0.015], "#e8833a");
  add([-0.1, 0.52, 0.163], [0.02, 0.015, 0.015], "#3a6fb5");
  add([-0.13, 0.4, 0.16], [0.012, 0.045, 0.015], dark);

  // lower pockets + buttons
  for (const sx of [-1, 1]) {
    add([sx * 0.14, 0.14, 0.156], [0.15, 0.13, 0.02], shade(jacket, -0.06));
    add([sx * 0.14, 0.205, 0.158], [0.15, 0.03, 0.02], light);
    add([sx * 0.14, 0.19, 0.16], [0.02, 0.02, 0.02], dark);
  }

  // epaulettes
  for (const sx of [-1, 1]) {
    add([sx * 0.17, 0.585, 0.02], [0.13, 0.03, 0.2], dark);
    add([sx * 0.1, 0.585, 0.1], [0.02, 0.02, 0.02], "#f2c94c");
  }

  // folds
  add([-0.16, 0.34, 0.153], [0.06, 0.02, 0.015], shade(jacket, -0.12));
  add([0.16, 0.28, 0.153], [0.06, 0.02, 0.015], shade(jacket, -0.12));

  // belt + buckle + pouches
  add([0, 0.02, 0], [0.47, 0.06, 0.31], cfg.belt ?? "#3a2a1a");
  add([0, 0.02, 0.157], [0.07, 0.05, 0.02], "#f2c94c");
  add([0, 0.02, 0.16], [0.03, 0.03, 0.015], "#8a5a2a");
  add([-0.16, -0.01, 0.14], [0.09, 0.09, 0.06], cfg.bootDark ?? cfg.belt);
  add([0.16, -0.01, 0.14], [0.11, 0.1, 0.06], cfg.belt);

  // backpack rig
  if (cfg.backpack) {
    const pack = cfg.packColor ?? "#5f6f4a";
    const packDark = cfg.packDark ?? shade(pack, -0.15);
    add([0, 0.3, -0.25], [0.34, 0.44, 0.2], pack);
    add([0, 0.3, -0.355], [0.28, 0.38, 0.02], packDark);
    add([-0.12, 0.3, -0.36], [0.02, 0.34, 0.02], pack);
    add([0.12, 0.3, -0.36], [0.02, 0.34, 0.02], pack);
    add([0, 0.52, -0.26], [0.36, 0.12, 0.24], shade(pack, -0.08));
    add([0, 0.575, -0.26], [0.36, 0.03, 0.24], packDark);
    for (const sx of [-1, 1]) {
      add([sx * 0.1, 0.51, -0.145], [0.04, 0.14, 0.02], "#6b4420");
      add([sx * 0.1, 0.45, -0.15], [0.05, 0.04, 0.03], "#f2c94c");
    }
    add([-0.2, 0.24, -0.25], [0.05, 0.18, 0.16], packDark);
    add([0.2, 0.24, -0.25], [0.05, 0.18, 0.16], packDark);
    add([-0.2, 0.33, -0.25], [0.05, 0.03, 0.16], "#6b4420");
    add([0.2, 0.33, -0.25], [0.05, 0.03, 0.16], "#6b4420");
    add([0, 0.64, -0.26], [0.4, 0.12, 0.16], cfg.bedroll ?? "#4f7a4a");
    add([-0.13, 0.64, -0.26], [0.03, 0.14, 0.17], "#8a5a2a");
    add([0, 0.64, -0.26], [0.03, 0.14, 0.17], "#8a5a2a");
    add([0.13, 0.64, -0.26], [0.03, 0.14, 0.17], "#8a5a2a");
    add([0, 0.55, -0.3], [0.34, 0.07, 0.12], "#3f5a3a");
    add([0.24, 0.42, -0.24], [0.09, 0.12, 0.1], "#8a8a3a");
    add([0.24, 0.5, -0.24], [0.09, 0.03, 0.1], "#6b6b2a");
    add([-0.24, 0.36, -0.24], [0.07, 0.12, 0.09], "#3a6a8a");
    add([-0.24, 0.43, -0.24], [0.07, 0.03, 0.09], "#2a5a7a");
    add([0.24, 0.28, -0.24], [0.14, 0.03, 0.11], "#f2c94c");
    add([0.24, 0.19, -0.24], [0.15, 0.07, 0.05], "#9aa8b5");
    add([-0.18, 0.13, -0.22], [0.09, 0.09, 0.08], "#8a8a8a");
    add([-0.13, 0.13, -0.22], [0.02, 0.05, 0.05], "#8a8a8a");
  }

  // armor
  if (cfg.style === "armor") {
    add([-0.2, 0.4, 0.05], [0.1, 0.26, 0.26], light);
    add([0.2, 0.4, 0.05], [0.1, 0.26, 0.26], light);
    add([-0.2, 0.52, 0.05], [0.12, 0.04, 0.28], dark);
    add([0.2, 0.52, 0.05], [0.12, 0.04, 0.28], dark);
    add([0, 0.44, 0.15], [0.2, 0.18, 0.03], "#2f3d4a");
    add([-0.16, 0.3, 0.15], [0.05, 0.05, 0.02], "#5eead4");
    add([0.16, 0.3, 0.15], [0.05, 0.05, 0.02], "#5eead4");
    for (const [x, y] of [[-0.2, 0.5], [0.2, 0.5], [-0.2, 0.3], [0.2, 0.3]]) {
      add([x, y, 0.165], [0.02, 0.02, 0.015], "#5f7285");
    }
  }

  // apron
  if (cfg.apron) {
    add([0, 0.18, 0.16], [0.3, 0.34, 0.02], cfg.apron);
    add([0, 0.36, 0.16], [0.3, 0.03, 0.02], shade(cfg.apron, -0.15));
    add([0, 0.17, 0.17], [0.1, 0.12, 0.02], shade(cfg.apron, 0.12));
  }

  return b;
}

function buildArm(cfg, side) {
  const b = [];
  const add = (p, s, c) => b.push({ p, s, c });
  const jacket = cfg.jacket;
  const dark = cfg.jacketDark ?? jacket;
  const light = cfg.jacketLight ?? jacket;

  add([0, -0.1, 0], [0.15, 0.26, 0.2], jacket);
  add([side * 0.06, -0.1, 0.08], [0.03, 0.24, 0.02], shade(jacket, 0.06));
  add([0, -0.1, -0.08], [0.13, 0.24, 0.02], dark);
  add([0, -0.24, 0], [0.14, 0.05, 0.19], light);
  add([0, -0.32, 0], [0.13, 0.16, 0.17], jacket);
  add([0, -0.42, 0], [0.145, 0.05, 0.18], dark);
  add([0, -0.455, 0], [0.13, 0.02, 0.16], shade(dark, -0.15));
  add([0, -0.5, 0], [0.11, 0.1, 0.12], cfg.skin);
  add([side * 0.04, -0.49, 0.05], [0.03, 0.05, 0.05], cfg.skinLight ?? cfg.skin);
  add([side * 0.09, -0.12, 0], [0.03, 0.08, 0.08], dark);
  if (cfg.style === "armor") {
    add([0, -0.3, 0], [0.16, 0.2, 0.21], cfg.jacketLight ?? jacket);
    add([0, -0.4, 0], [0.17, 0.04, 0.22], dark);
    add([side * 0.085, -0.3, 0], [0.02, 0.08, 0.08], "#5eead4");
  }
  if (cfg.watch && side < 0) {
    add([0, -0.57, 0], [0.12, 0.03, 0.13], "#2a2a2a");
    add([0, -0.57, 0.065], [0.06, 0.05, 0.01], "#5eead4");
  }
  return b;
}

function buildLeg(cfg, side) {
  const b = [];
  const add = (p, s, c) => b.push({ p, s, c });
  const pants = cfg.pants;
  const dark = cfg.pantsDark ?? pants;
  const light = cfg.pantsLight ?? pants;

  add([0, -0.17, 0], [0.19, 0.3, 0.21], pants);
  add([side * 0.09, -0.17, 0], [0.02, 0.28, 0.19], light);
  add([0, -0.42, 0], [0.17, 0.24, 0.19], pants);
  add([side * 0.08, -0.42, 0], [0.02, 0.22, 0.17], light);
  add([0, -0.31, 0], [0.2, 0.04, 0.22], dark);
  add([0, -0.3, 0.105], [0.14, 0.03, 0.015], shade(dark, 0.15));
  add([side * 0.1, -0.2, 0], [0.03, 0.15, 0.13], dark);
  add([side * 0.1, -0.13, 0], [0.035, 0.03, 0.14], shade(dark, 0.2));
  add([side * 0.1, -0.2, 0.055], [0.02, 0.02, 0.02], "#f2c94c");
  add([0, -0.49, 0], [0.18, 0.05, 0.2], light);
  add([0, -0.62, 0.02], [0.21, 0.16, 0.28], cfg.boots);
  add([0, -0.58, 0.13], [0.17, 0.06, 0.08], cfg.bootDark ?? cfg.boots);
  add([0, -0.7, 0.13], [0.19, 0.06, 0.1], cfg.bootDark ?? cfg.boots);
  add([-0.08, -0.66, 0.16], [0.02, 0.02, 0.02], "#3a2a1a");
  add([0.08, -0.66, 0.16], [0.02, 0.02, 0.02], "#3a2a1a");
  add([0, -0.735, 0.02], [0.22, 0.07, 0.3], cfg.sole ?? "#2a1a0a");
  add([0, -0.755, 0.02], [0.23, 0.02, 0.31], shade(cfg.sole ?? "#2a1a0a", -0.2));
  for (let i = 0; i < 3; i += 1) {
    add([0, -0.6 + i * 0.05, 0.17], [0.14, 0.02, 0.02], "#e8d9b8");
  }
  add([0, -0.64, 0.02], [0.21, 0.02, 0.27], cfg.bootDark ?? cfg.boots);
  return b;
}

export function buildCharacterParts(cfg) {
  return {
    legL: { pivot: [-0.12, 0.78, 0], boxes: buildLeg(cfg, -1) },
    legR: { pivot: [0.12, 0.78, 0], boxes: buildLeg(cfg, 1) },
    torso: { pivot: [0, 0.78, 0], boxes: buildTorso(cfg) },
    armL: { pivot: [-0.3, 1.28, 0], boxes: buildArm(cfg, -1) },
    armR: { pivot: [0.3, 1.28, 0], boxes: buildArm(cfg, 1) },
    head: { pivot: [0, 1.4, 0], boxes: buildHead(cfg) },
    face: cfg.face
      ? {
          eyeX: cfg.face.eyeX,
          eyeY: cfg.face.eyeY,
          eyeW: cfg.face.eyeW,
          eyeH: cfg.face.eyeH,
          mouthY: cfg.face.mouthY,
          mouthW: cfg.face.mouthW,
          iris: cfg.eye ?? "#3a2214",
          lens: Boolean(cfg.glasses),
          lensColor: cfg.lens ?? "#bcd8e8",
        }
      : null,
  };
}
