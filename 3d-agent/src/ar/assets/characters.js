// Sprite character registry: every entry is a descriptor with one sheet per
// animation (`idle`, optionally `walk` / `dance`). The billboard falls back to
// `idle` for animations a character doesn't have.

import { NISCHAL } from "./nischal";
import { VIRGO } from "./virgo";

export const CHARACTERS = {
  nischal: NISCHAL,
  virgo: VIRGO,
};

export const CHARACTER_KEYS = Object.keys(CHARACTERS);

export const ANIMATION_ORDER = ["idle", "walk", "dance"];

export function animationsOf(character) {
  return ANIMATION_ORDER.filter((name) => Boolean(character?.[name]));
}

export function resolveCharacter(key) {
  return CHARACTERS[key] ?? CHARACTERS[CHARACTER_KEYS[0]];
}
