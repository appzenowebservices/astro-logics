// Procedural character registry — pure three.js primitives, no external format.
// Each variant is built in meters with feet at y=0 so the rig can ground it.

export const CODE_CHARACTERS = {
  explorer: { label: "EXPLORER", name: "Voxel · Explorer" },
  curly: { label: "CURLY", name: "Voxel · Curly" },
  beanie: { label: "BEANIE", name: "Voxel · Beanie" },
  flora: { label: "FLORA", name: "Voxel · Flora" },
  cyborg: { label: "CYBORG", name: "Voxel · Cyborg" },
  man: { label: "MAN", name: "Voxel · Man" },
  woman: { label: "WOMAN", name: "Voxel · Woman" },
  elder: { label: "ELDER", name: "Voxel · Elder" },
  agent: { label: "AGENT", name: "Code · Agent" },
  robot: { label: "ROBOT", name: "Code · Robot" },
  orb: { label: "ORB", name: "Code · Orb" },
};

export function isCodeCharacter(source) {
  return Boolean(CODE_CHARACTERS[source]);
}
