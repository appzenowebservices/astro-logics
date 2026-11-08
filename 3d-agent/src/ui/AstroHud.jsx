// src/ui/AstroHud.jsx
//
// Live sidereal console for the planet layer. Mirrors the store that drives
// AstroLayer, so selecting a graha in 3D highlights it here and vice versa.

import "./astro.css";
import { useAstro, astroActions } from "../astro/astroStore";
import { grahaPositionLabel } from "../astro/astroClient";

const clock = (ts) =>
  ts
    ? new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

export function AstroHud() {
  const { connected, loading, error, chart, grahas, selected, updatedAt, active } =
    useAstro();

  const selectedGraha = grahas.find((graha) => graha.key === selected) ?? null;

  return (
    <aside className="astro-hud ui-interactive">
      <header className="astro-head">
        <span className={`astro-dot ${connected ? "ok" : "bad"}`} />
        <b>ASTRO.SYS</b>
        <span className="astro-src">Kaalvanta · sidereal</span>
        <button
          type="button"
          className="astro-toggle"
          onClick={astroActions.toggleActive}
          title={active ? "Hide the planetary layer" : "Show the planetary layer"}
        >
          {active ? "HIDE" : "SHOW"}
        </button>
      </header>

      <div className="astro-meta">
        <span>{chart?.ascendant?.sign ?? "—"} ASC</span>
        <span>{loading ? "SYNC…" : clock(updatedAt)}</span>
        <button
          type="button"
          onClick={astroActions.refresh}
          disabled={loading}
          title="Refresh the chart"
        >
          SYNC
        </button>
      </div>

      {error && <p className="astro-error">{error}</p>}

      {!grahas.length && !error && (
        <p className="astro-empty">Awaiting the Kaalvanta chart…</p>
      )}

      <ul className="astro-list">
        {grahas.map((graha) => (
          <li key={graha.key}>
            <button
              type="button"
              className={selected === graha.key ? "on" : ""}
              onClick={() => astroActions.select(graha.key)}
            >
              <span className="g" style={{ color: graha.color }}>
                {graha.glyph}
              </span>
              <span className="n">{graha.label}</span>
              <span className="p">
                {Number(graha.degree).toFixed(1)}° {graha.sign.slice(0, 3)}
              </span>
              <span className="h">H{graha.house ?? "?"}</span>
              {graha.isRetrograde && <span className="r">R</span>}
            </button>
          </li>
        ))}
      </ul>

      {selectedGraha && (
        <div className="astro-detail">
          <div className="astro-detail-title">
            <span style={{ color: selectedGraha.color }}>
              {selectedGraha.glyph}
            </span>
            {selectedGraha.label}
            <em>{selectedGraha.key}</em>
          </div>
          <dl>
            <div>
              <dt>POSITION</dt>
              <dd>{grahaPositionLabel(selectedGraha)}</dd>
            </div>
            <div>
              <dt>CONDITION</dt>
              <dd className={`cond ${selectedGraha.condition}`}>
                {selectedGraha.condition}
              </dd>
            </div>
            <div>
              <dt>ELEMENT</dt>
              <dd>{selectedGraha.element}</dd>
            </div>
            <div>
              <dt>SPEED</dt>
              <dd>{selectedGraha.speed}°/day</dd>
            </div>
          </dl>
          <button
            type="button"
            className="astro-close"
            onClick={astroActions.clear}
          >
            CLOSE
          </button>
        </div>
      )}

      <footer className="astro-foot">
        {grahas.length}/9 grahas · refreshed every 60s
      </footer>
    </aside>
  );
}
