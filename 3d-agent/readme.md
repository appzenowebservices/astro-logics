# Simulation

The simulation owns the world.

Rendering serves only as a visualization layer — it does not drive simulation logic.

Entities exist as independent units of state.

Systems evolve entities by processing their components over time.

The Engine orchestrates all subsystems, mediating interactions and maintaining the simulation lifecycle.

---------------------------------------
Everything in Mithuna belongs to one of five categories.    

Simulation
The brain.

Systems
How the world evolves.

Entities
What exists.

Rendering
How the world is visualized.

Infrastructure
How data enters and leaves the simulation.


---------------------------------------
The mineral world, after billions of years, eventually learned to think through biology, and biology is now teaching minerals to think directly through silicon.
---------------------------------------
Reality
↓
Signal
↓
Data
↓
Information
↓
Knowledge
↓
Archetype
↓
Decision
↓
Action
↓
Reality
---------------------------------------

## Architecture

Mithuna Engine is the **visual reflex** of a three-part agent company:

| Pillar | Role | Location |
| --- | --- | --- |
| hermes-agent | Executor / brain. Runs the HTTP server on `:8765` (`hermes_server.py`). | `../hermes-agent` |
| paperclip | Control plane. Authoritative domain FSM (agents, issues, runs) on `:3100`. | `../paperclip` |
| **Mithuna Engine** | **Body and face.** Renders agents and reflects paperclip state. Decides how to *show* work, never what work to do. | this repo |

Mithuna subscribes to paperclip's company live-event stream (`/api/companies/:id/events/ws`) and to its REST API. Domain state flows **one way**:

```
paperclip events/API
   → paperclipStore  (snapshot: agentStatus, issueStatusByAgent, presence)
   → IntentResolver  (deterministic: status+issue ⇒ intent)
   → CharacterStateMachine + Animation/Expression drivers
   → rendered agent movement / pose / ring / label
```

Intent resolution is deterministic and pure (`src/simulation/intent/IntentResolver.js`): e.g. `in_progress` ⇒ `GO_TO_DESK`, `in_review` ⇒ `GO_TO_BOARDROOM`, `done` ⇒ `RETURN_TO_SPAWN`, `blocked` ⇒ `HOLD`, `running` ⇒ `WORK_TALK`. Directed intents cancel free wander; `IDLE` leaves the agent to NpcAgentDriver-style autonomy (wander, sit, wave/happy/look_around reactions).

### Degradation by design

Capabilities are probed from the loaded model (`capabilities.js`). The current `player.glb` has only a `walk` clip and no morph targets, so every non-walk state falls back to `walk`/`idle` and facial expressions become no-ops — the status ring + name bubble remain the source of truth. Nothing breaks when a clip or a face is missing.

### Live astro layer (Kaalvanta)

The world also carries a **sidereal parliament** fed by Kaalvanta, the
astrological control plane. It is independent of Paperclip: when paperclip is
offline the office still loads and the grahas keep updating.

```
Kaalvanta tRPC (mundane.calculateChart, Lahiri sidereal)
   → /kaalvanta proxy (vite.config.js, KAALVANTA_PORT, default 8888)
   → astroStore (60 s poll, geolocation)
   → AstroLayer (true longitude → orbit position)
   → AstroHud (positions, houses, retrograde/combust state)
```

- **Nine grahas** — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu
  (mean node) and derived Ketu. Each sits at its real sidereal longitude on a
  holographic ring around the player; the Ascendant gets an `ASC` marker.
- **Signals** — retrograde planets carry an amber torus, combust planets dim,
  and clicking a sphere (or a HUD row) opens its dossier: sign, degree, house,
  element, daily speed.
- **Controls** — `HIDE` collapses the 3D layer but keeps polling; `SYNC` forces
  a refresh. Positions refresh every 60 seconds and on `SYNC`.

Files: `src/astro/{planetMeta,astroClient,astroStore,AstroLayer}.js(x)` and
`src/ui/AstroHud.jsx` (+ `astro.css`). Location comes from the browser; without
permission it falls back to New Delhi (28.61 N, 77.21 E).

### Running locally

```sh
# 1. paperclip (control plane) — its own repo, port 3100
cd ../paperclip && pnpm dev

# 2. hermes (executor) — HTTP server, port 8765
cd ../hermes-agent && env/Scripts/python.exe hermes_server.py
#   optional presence telemetry (reports agent.presence live events):
#   set PAPERCLIP_COMPANY_ID + PAPERCLIP_AGENT_ID (and optionally
#   PAPERCLIP_AGENT_API_KEY / PAPERCLIP_BASE_URL) before starting.

# 3. Mithuna Engine (client) — Vite dev server (default port 3000)
npm run dev
```

The Vite server proxies `/api` and the live-event socket to paperclip. Open `/simulation`, pick a company with agents/issues, and watch the characters walk to desks, boardrooms, and spawn points as issue statuses change. `agent.presence` (reported by hermes) dims agents that go offline.

### Routes

| Route | What it is |
| --- | --- |
| `/` | Landing page — a **Remotion** showcase (`@remotion/player`) with five animated scenes: kinetic intro, telemetry infographics, the hermes→paperclip→mithuna pipeline, an AR demo with the CSS voxel character, and the CTA. Scene jumps, accent switching, scrubbing and keyboard control are wired straight into the player. |
| `/world` | Standalone 3D view — the code-built voxel market street with the Nischal sprite standing in it, orbit camera, idle/walk/dance switcher. Same scene modules as `/ar-feature`, no camera feed. |
| `/simulation` | The console (three.js world, agents, live events). |
| `/ar-feature` | Camera passthrough AR feature — place the sprite in the real world (its `VILLAGE` world mode is the same voxel street). |

The showcase lives in `src/landing/` — `showcase/MithunaShowcase.jsx` is the composition (scenes as React components; `inputProps` like `accent` re-render it live), `showcase/bits.jsx` holds the shared visual bits (backdrop, counters, charts, and a fully CSS-built voxel character). Because it is one composition, the same file renders to MP4 server-side with `@remotion/renderer` (headless Chrome) — install it and run `npx remotion render` style tooling when you need exported video rather than the in-browser player.


### AR feature (`/ar-feature`)

A separate mobile-first page that composites a three.js character into the live camera feed.

- Open `http://localhost:3000/ar-feature` (dev) or `https://<host>/ar-feature` (prod; nginx SPA fallback serves it).
- **Permission flow**: the gate asks for camera on tap (iOS requires the gesture). Denied/unavailable → use **DEMO MODE** (gradient studio floor, no camera).
- **Place/anchor**: tap the floor to place, drag anywhere to grab and move. Position is damped (no jitter) and the character lands with an ease-out drop; a soft blob shadow keeps it grounded.
- **Characters**: sprites from `public/sprite/`, registered in `src/ar/assets/characters.js`:
  - **Nischal** — idle (5×5, 24f @8), walk (5×5, 22f @12), dance (5×5, 25f @12)
  - **Virgo** — the green hooded bean, idle (5×5, 25f @10, expression loop)
  
  The HUD has a character picker and only lists the animations a character actually has (the billboard falls back to `idle` for missing ones). Each frame is UV-cropped to the character's content box (measured from the alpha channel) so the feet land exactly on the ground plane. The simulation player uses the same sprites — `/simulation?character=virgo` swaps the player.
- **Adding sheets**: `node scripts/measure-sprite.mjs public/sprite/<sheet>.png [cols] [rows]` prints frames + crop to paste into `src/ar/assets/nischal.js`. If a sheet was exported on an opaque flat background (black or white), run `node scripts/key-bg.mjs <in.png> [out.png] [tolerance]` first — it auto-detects the background colour and flood-fills from the border, so enclosed whites (eyes, glasses) and dark hair survive. The exact generation prompt for new sheets lives in `public/sprite/PROMPT.md`.
- **World**: the `WORLD` button cycles `off → stage → all → village`. Stage is a holographic pedestal (glow disc, amber ring, counter-rotating arcs, aqua pulse) that tracks the character; `all` adds a fade-out ground grid and floating embers; `village` swaps in a code-built voxel market street — cobbled lane, orange house with balcony, blue chai-shop building with canvas-text signs, fruit-mart stall with crates of produce, tree, auto-rickshaw and overhead cables (all boxes merged into one vertex-colored mesh). World, character, camera feed and HUD all composite into one WebGL canvas, so `REC` captures the whole scene.
- **Record**: `REC` composites the video + WebGL canvas through `MediaRecorder` and auto-downloads a `.webm`/`.mp4` (browser-dependent).

Supported browsers: Android Chrome (best), iOS Safari 16.4+, desktop Chrome/Edge/Safari with a webcam. Camera requires HTTPS (or `localhost`). All inference/rendering is local; the feed never leaves the device.

Module boundaries:

| Layer | Location |
| --- | --- |
| camera | `src/ar/camera/useCamera.js` |
| tracking | `src/ar/tracking/` (screen→ground raycast; WebXR/vision providers plug in here) |
| scene | `src/ar/scene/ArScene.jsx` (camera canvas + lighting) |
| character | `src/ar/character/SpriteBillboard.jsx` (sprite sheet billboard) · `useCharacterRig.js` (damping/landing/yaw/shadow) |
| assets | `src/ar/assets/characters.js` (registry) · `nischal.js` / `virgo.js` (grid, frames, fps, content crop) |
| world | `src/ar/world/ArWorld.jsx` (pedestal, grid, embers) · `VoxelStreet.jsx` (market) |
| overlay | `src/ar/ui/ArHud.jsx` |
| export | `src/ar/export/useRecorder.js` |

Phases: **P1** camera + character placement (done) → **P2** MediaPipe pose/face/hands anchoring to a detected person → **P3** garment overlays + VLM labels through a rate-limited backend route → **P4** WebXR hit-test (ARCore) + server-side render. Non-goals for v1: cloth simulation, multi-user sync.


---------------------------------------

Reality
↓
Signal
↓
Data
↓
Information
↓
Knowledge
↓
Archetype
↓
Decision
↓
Action
↓
Reality
---------------------------------------
