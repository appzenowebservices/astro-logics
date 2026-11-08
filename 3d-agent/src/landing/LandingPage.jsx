// Root landing page — the Remotion showcase in the hero, with scene jumps,
// accent switching, scrubbing and keyboard control wired to the Player.

import { useCallback, useEffect, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { MithunaShowcase, SCENES, TOTAL_FRAMES } from "./showcase/MithunaShowcase";
import "./landing.css";

const ACCENTS = [
  { id: "amber", color: "#f6ad3f" },
  { id: "aqua", color: "#5eead4" },
  { id: "periwinkle", color: "#8b9cf9" },
];

const FEATURE_COPY = {
  intro: "Kinetic type over a drifting grid — the console's HUD language, rendered as video.",
  telemetry: "Counters, area charts and a scrolling ticker animate from the same paperclip state the console shows.",
  pipeline: "hermes → paperclip → mithuna drawn as a live diagram with packets travelling the wire.",
  ar: "The voxel character walks and talks inside a phone frame — same code-driven approach as /ar-feature.",
  engage: "Every scene is a React component: change a prop, re-render a different video.",
};

const formatTime = (frame) => {
  const s = Math.floor(frame / 30);
  const f = frame % 30;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};

export function LandingPage() {
  const playerRef = useRef(null);
  const progressRef = useRef(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [accent, setAccent] = useState("amber");
  const [scene, setScene] = useState(0);

  const accentColor = ACCENTS.find((a) => a.id === accent)?.color ?? ACCENTS[0].color;

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return undefined;
    const onFrame = (event) => {
      const f = event.detail.frame;
      setFrame(f);
      let idx = 0;
      SCENES.forEach((s, i) => {
        if (f >= s.from) idx = i;
      });
      setScene(idx);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, []);

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) player.pause();
    else player.play();
  }, []);

  const jump = useCallback((index) => {
    playerRef.current?.seekTo(SCENES[index].from);
    setScene(index);
  }, []);

  const onScrub = useCallback((event) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    playerRef.current?.seekTo(Math.round(ratio * (TOTAL_FRAMES - 1)));
  }, []);

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === " ") {
        event.preventDefault();
        toggle();
      } else if (event.key === "ArrowRight") {
        playerRef.current?.seekTo(Math.min(TOTAL_FRAMES - 1, frame + 30));
      } else if (event.key === "ArrowLeft") {
        playerRef.current?.seekTo(Math.max(0, frame - 30));
      }
    },
    [frame, toggle]
  );

  return (
    <div className="landing" style={{ "--accent": accentColor }}>
      <div className="bg-grid" />
      <div className="bg-glow" />

      <nav className="nav">
        <div className="brand">
          MITHUNA<span>· ENGINE</span>
        </div>
        <div className="nav-links">
          <a href="/simulation">Console</a>
          <a href="/world">World</a>
          <a href="/ar-feature">AR Feature</a>
          <span className="badge">remotion showcase</span>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <div className="kicker">programmatic video · infographics · interactive</div>
          <h1>
            Video that renders <em>from your state</em>, live in the browser.
          </h1>
          <p>
            The showcase on the right is one Remotion composition — five scenes of kinetic typography, animated
            charts and a code-built voxel character. Scrub it, jump between scenes, switch the accent: it all
            re-renders in real time, and the same file exports to MP4 on the server.
          </p>
          <div className="cta-row">
            <a className="btn primary" href="/simulation">
              Open the console
            </a>
            <a className="btn ghost" href="/ar-feature">
              Try the AR feature
            </a>
          </div>
          <div className="controls" tabIndex={0} onKeyDown={onKeyDown}>
            <button className="icon-btn" onClick={toggle} aria-label="play/pause">
              {playing ? "❚❚" : "▶"}
            </button>
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                className={`scene-chip${i === scene ? " on" : ""}`}
                onClick={() => jump(i)}
              >
                {s.label}
              </button>
            ))}
            <span className="accent-switch">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  className={`dot${a.id === accent ? " on" : ""}`}
                  style={{ "--dot": a.color }}
                  onClick={() => setAccent(a.id)}
                  aria-label={`accent ${a.id}`}
                />
              ))}
            </span>
          </div>
          <div className="hint">space play/pause · ← → 1s · click the bar to scrub</div>
        </div>

        <div className="hero-player">
          <div className="frame">
            <div className="frame-bar">
              <span />
              <span />
              <span />
              <div className="frame-url">mithuna://showcase · remotion player</div>
            </div>
            <Player
              ref={playerRef}
              component={MithunaShowcase}
              inputProps={{ accent }}
              durationInFrames={TOTAL_FRAMES}
              fps={30}
              compositionWidth={1280}
              compositionHeight={720}
              style={{ width: "100%", aspectRatio: "16 / 9" }}
              autoPlay
              loop
              clickToPlay={false}
            />
          </div>
          <div className="progress" ref={progressRef} onClick={onScrub}>
            <div className="progress-fill" style={{ width: `${(frame / (TOTAL_FRAMES - 1)) * 100}%` }} />
            {SCENES.map((s) => (
              <span key={s.id} className="tick" style={{ left: `${(s.from / (TOTAL_FRAMES - 1)) * 100}%` }} />
            ))}
          </div>
          <div className="player-meta">
            <span className="scene-name">{SCENES[scene].label}</span>
            <span className="time">{formatTime(frame)}</span>
          </div>
        </div>
      </header>

      <section className="features">
        <div className="section-head">
          <div className="kicker">inside the showcase</div>
          <h2>Five scenes, one React tree</h2>
        </div>
        <div className="cards">
          {SCENES.map((s, i) => (
            <button key={s.id} className="card" onClick={() => jump(i)}>
              <div className="card-index">{String(i + 1).padStart(2, "0")}</div>
              <div className="card-title">{s.label}</div>
              <p>{FEATURE_COPY[s.id]}</p>
              <div className="card-time">
                {formatTime(s.from)} → {formatTime(s.from + s.duration)}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="stack">
        <div className="section-head">
          <div className="kicker">the pipeline</div>
          <h2>Same composition, three surfaces</h2>
        </div>
        <div className="stack-grid">
          <div className="stack-item">
            <b>In the browser</b>
            <span>@remotion/player — what you just watched, driven by props and seekTo().</span>
          </div>
          <div className="stack-item">
            <b>On the server</b>
            <span>@remotion/renderer (headless Chrome) turns any frame range into MP4/WebM — infographics on demand.</span>
          </div>
          <div className="stack-item">
            <b>In the studio</b>
            <span>npx remotion studio for timeline editing, previews and parameter tweaking.</span>
          </div>
        </div>
        <div className="chips-row">
          {["remotion", "react", "three.js", "vite", "@remotion/player"].map((t) => (
            <span key={t} className="tech">{t}</span>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div>MITHUNA ENGINE — the visual reflex of an agent company.</div>
        <div className="footer-links">
          <a href="/simulation">/simulation</a>
          <a href="/world">/world</a>
          <a href="/ar-feature">/ar-feature</a>
          <a href="/">/</a>
        </div>
      </footer>
    </div>
  );
}
