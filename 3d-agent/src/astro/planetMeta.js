// src/astro/planetMeta.js
//
// Static presentation data for the nine grahas. Everything numeric that
// matters (longitude, sign, house, retrograde) arrives live from Kaalvanta;
// this file only decides how a graha looks in the world.

export const GRAHA_ORDER = [
  "SUN",
  "MOON",
  "MERCURY",
  "VENUS",
  "MARS",
  "JUPITER",
  "SATURN",
  "RAHU",
  "KETU",
];

export const GRAHA = {
  SUN: {
    glyph: "☉",
    label: "Surya",
    color: "#f4b942",
    element: "fire",
    radius: 6.4,
  },
  MOON: {
    glyph: "☾",
    label: "Chandra",
    color: "#dce8f5",
    element: "water",
    radius: 3.3,
  },
  MERCURY: {
    glyph: "☿",
    label: "Budha",
    color: "#8fd0ae",
    element: "earth",
    radius: 5.2,
  },
  VENUS: {
    glyph: "♀",
    label: "Shukra",
    color: "#f0a8c8",
    element: "water",
    radius: 5.8,
  },
  MARS: {
    glyph: "♂",
    label: "Mangala",
    color: "#e05a47",
    element: "fire",
    radius: 7.0,
  },
  JUPITER: {
    glyph: "♃",
    label: "Guru",
    color: "#e0b45f",
    element: "fire",
    radius: 7.7,
  },
  SATURN: {
    glyph: "♄",
    label: "Shani",
    color: "#9fb0c6",
    element: "air",
    radius: 8.4,
  },
  RAHU: {
    glyph: "☊",
    label: "Rahu",
    color: "#7d8bd6",
    element: "air",
    radius: 4.0,
  },
  KETU: {
    glyph: "☋",
    label: "Ketu",
    color: "#c08ade",
    element: "fire",
    radius: 4.6,
  },
};

export const SIGNS = [
  "ARIES",
  "TAURUS",
  "GEMINI",
  "CANCER",
  "LEO",
  "VIRGO",
  "LIBRA",
  "SCORPIO",
  "SAGITTARIUS",
  "CAPRICORN",
  "AQUARIUS",
  "PISCES",
];

export const SIGN_GLYPHS = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];

export const ELEMENT_TONE = {
  fire: "#e0703c",
  earth: "#8fae7a",
  air: "#8fb3d9",
  water: "#8da6d8",
};
