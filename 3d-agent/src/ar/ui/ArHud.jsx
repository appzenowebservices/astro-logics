// UI layer: permission gate + mobile control bar for the AR page.

import { useEffect, useRef, useState } from "react";

function Slider({ label, min, max, step, value, onChange }) {
  return (
    <label className="ar-field">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
    </label>
  );
}

export function ArHud({
  live,
  demo,
  starting,
  error,
  facing,
  mirrored,
  placed,
  sheet,
  character,
  characters = [],
  animations = ["idle"],
  animation,
  scale,
  shadow,
  world,
  recorderSupported,
  recording,
  elapsed,
  lastExport,
  onStart,
  onDemo,
  onToggleFacing,
  onToggleMirror,
  onToggleShadow,
  onWorld,
  onCharacter,
  onAnimation,
  onScale,
  onRecord,
  onReset,
}) {
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    if (!lastExport) return undefined;
    setSavedAt(Date.now());
    const timer = setTimeout(() => setSavedAt(0), 4000);
    return () => clearTimeout(timer);
  }, [lastExport]);

  if (!live && !demo) {
    return (
      <div className="ar-gate">
        <div className="ar-gate-card">
          <div className="ar-gate-kicker">MITHUNA · AR FEATURE</div>
          <h1 className="ar-gate-title">Put Nischal in your world</h1>
          <p className="ar-gate-copy">
            Camera passthrough with a hand-drawn sprite character. Tap the floor to place, drag to
            move, cycle the world, record the result.
          </p>

          {error ? <div className="ar-error">{error}</div> : null}

          <button className="ar-cta" onClick={onStart} disabled={starting}>
            {starting ? "REQUESTING CAMERA…" : "ENABLE CAMERA"}
          </button>
          <button className="ar-cta ghost" onClick={onDemo}>
            DEMO MODE — NO CAMERA
          </button>

          <div className="ar-gate-note">
            Works on Android Chrome (ARCore-ready) and iOS Safari. The camera feed never leaves your
            device.
          </div>
          <a className="ar-back" href="/simulation">
            ← Back to simulation
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="ar-topbar">
        <span className={`ar-badge ${live ? "live" : "demo"}`}>{live ? "CAM" : "DEMO"}</span>
        {live ? (
          <button className="ar-chip" onClick={onToggleFacing}>
            {facing === "environment" ? "REAR" : "FRONT"} ⇄
          </button>
        ) : null}
        <span className={`ar-chip ${placed ? "ok" : "hint"}`}>
          {placed ? "ANCHORED" : "TAP THE FLOOR TO PLACE"}
        </span>
        {savedAt ? <span className="ar-chip ok">SAVED ✓</span> : null}
      </div>

      <div className="ar-controls">
        {characters.length > 1 ? (
          <div className="ar-row">
            {characters.map((key) => (
              <button
                key={key}
                className={`ar-btn ${character === key ? "on" : ""}`}
                onClick={() => onCharacter(key)}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>
        ) : null}

        <div className="ar-row">
          {animations.map((name) => (
            <button
              key={name}
              className={`ar-btn ${animation === name ? "on" : ""}`}
              onClick={() => onAnimation(name)}
            >
              {name.toUpperCase()}
            </button>
          ))}
          <button className={`ar-btn ${shadow ? "on" : ""}`} onClick={onToggleShadow}>
            SHADOW
          </button>
          <button
            className={`ar-btn ${world !== "off" ? "on" : ""}`}
            onClick={onWorld}
            title="Cycle world: off / stage / all / village"
          >
            {world === "off"
              ? "WORLD OFF"
              : world === "stage"
                ? "WORLD"
                : world === "all"
                  ? "WORLD+"
                  : "VILLAGE"}
          </button>
        </div>

        <div className="ar-row">
          <button className={`ar-btn ${mirrored ? "on" : ""}`} onClick={onToggleMirror}>
            MIRROR
          </button>
          <button className="ar-btn" onClick={onReset}>
            RESET
          </button>
          {recorderSupported ? (
            <button className={`ar-btn rec ${recording ? "recording" : ""}`} onClick={onRecord}>
              {recording ? `STOP ${elapsed.toFixed(1)}s` : "REC"}
            </button>
          ) : null}
          <Slider
            label="SCALE"
            min={0.5}
            max={1.8}
            step={0.05}
            value={scale}
            onChange={onScale}
          />
        </div>

        <div className="ar-asset-name">{sheet.name} · sprite sheet</div>
      </div>
    </>
  );
}
