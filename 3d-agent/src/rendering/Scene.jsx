// src/rendering/Scene.jsx

import { PhysicsWorld } from "../physics/PhysicsWorld";
import { CompanyWorld } from "../world/CompanyWorld";
import { AstroLayer } from "../astro/AstroLayer";

export function Scene() {
  return (
    <PhysicsWorld>
      {/* Active world resolved from the selected Paperclip company
          (public/models/worlds/ via src/world/registry.js) */}
      <CompanyWorld />
      {/* Live sidereal parliament fed by Kaalvanta */}
      <AstroLayer />
    </PhysicsWorld>
  );
}
