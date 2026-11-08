// The Remotion composition showcased on the landing page.
// 5 scenes / 30 s at 30 fps: intro, telemetry infographics, architecture
// pipeline, AR feature demo (with the CSS voxel character) and the CTA.

import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, C, Chip, Counter, Kicker, Panel, Reveal, VoxelMan, font } from "./bits";

export const FPS = 30;

export const SCENES = [
  { id: "intro", label: "Intro", from: 0, duration: 150 },
  { id: "telemetry", label: "Telemetry", from: 150, duration: 210 },
  { id: "pipeline", label: "Pipeline", from: 360, duration: 210 },
  { id: "ar", label: "AR Mode", from: 570, duration: 210 },
  { id: "engage", label: "Engage", from: 780, duration: 120 },
];

export const TOTAL_FRAMES = 900;

const useAppear = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
};

const Fade = ({ duration, children, fade = 12 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, fade, duration - fade, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const Reticles = ({ color = C.amber }) => (
  <>
    {[
      { top: 26, left: 26, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
      { top: 26, right: 26, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` },
      { bottom: 26, left: 26, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
      { bottom: 26, right: 26, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` },
    ].map((s, i) => (
      <div key={i} style={{ position: "absolute", width: 26, height: 26, opacity: 0.5, ...s }} />
    ))}
  </>
);

/* ---------------- 1. Intro ---------------- */

const TitleScene = ({ accent }) => {
  const frame = useCurrentFrame();
  const appear = useAppear(0);
  const sweep = interpolate(frame, [18, 74], [-70, 130], { extrapolateRight: "clamp" });
  const sub = useAppear(34);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Reticles />
      <div style={{ position: "absolute", top: 74, opacity: appear }}>
        <Kicker>mithuna // simulation console</Kicker>
      </div>
      <div style={{ overflow: "hidden", padding: "10px 40px" }}>
        <Reveal
          text="MITHUNA"
          delay={6}
          stagger={3}
          style={{ fontFamily: font, fontSize: 154, fontWeight: 700, letterSpacing: 12, color: C.champagne, lineHeight: 1 }}
        />
      </div>
      <div
        style={{
          fontFamily: font,
          fontSize: 62,
          letterSpacing: 26,
          color: "transparent",
          WebkitTextStroke: `2px ${accent}`,
          opacity: interpolate(frame, [30, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          marginTop: 6,
        }}
      >
        ENGINE
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(102deg, transparent 44%, ${accent}66 50%, transparent 56%)`,
          transform: `translateX(${sweep}%)`,
          mixBlendMode: "screen",
        }}
      />
      <div style={{ marginTop: 34, opacity: sub, fontFamily: font, fontSize: 22, letterSpacing: 3, color: C.dim }}>
        the visual reflex of an agent company
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 52,
          fontFamily: font,
          fontSize: 17,
          letterSpacing: 3,
          color: C.dim,
          opacity: useAppear(56),
        }}
      >
        UNIT-042 · CONTAINMENT STABLE · <span style={{ color: C.green }}>SIGNAL LOCKED</span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 2. Telemetry ---------------- */

const StatCard = ({ label, value, suffix, decimals = 0, delay, accent }) => {
  const s = useAppear(delay);
  return (
    <Panel
      glow
      accent={accent}
      style={{ padding: "18px 22px", opacity: s, transform: `translateY(${(1 - s) * 24}px)` }}
    >
      <div style={{ fontFamily: font, fontSize: 44, color: C.champagne, fontWeight: 700 }}>
        <Counter to={value} delay={delay + 4} decimals={decimals} suffix={suffix} />
      </div>
      <div style={{ fontFamily: font, fontSize: 14, letterSpacing: 3, color: C.dim, marginTop: 6, textTransform: "uppercase" }}>
        {label}
      </div>
    </Panel>
  );
};

const TelemetryScene = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [30, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bars = [0.35, 0.55, 0.3, 0.72, 0.5, 0.9, 0.62, 0.78];
  const ticker = interpolate(frame, [0, 210], [0, -700]);

  return (
    <AbsoluteFill style={{ padding: "64px 70px" }}>
      <Reticles />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Kicker accent>telemetry</Kicker>
        <div style={{ fontFamily: font, fontSize: 16, letterSpacing: 2, color: C.dim }}>
          live · paperclip events → simulation
        </div>
      </div>

      <div style={{ display: "flex", gap: 26, marginTop: 30 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, width: 470 }}>
          <StatCard label="pillars" value={3} delay={8} accent={accent} />
          <StatCard label="agents on board" value={12} delay={14} accent={accent} />
          <StatCard label="console fps" value={60} delay={20} accent={accent} />
          <StatCard label="character systems" value={8} delay={26} accent={accent} />
        </div>

        <Panel style={{ flex: 1, padding: "22px 26px", position: "relative" }}>
          <div style={{ fontFamily: font, fontSize: 15, letterSpacing: 3, color: C.dim, textTransform: "uppercase" }}>
            heartbeat runs / hour
          </div>
          <svg width="100%" height="240" viewBox="0 0 560 240" style={{ marginTop: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1="0" x2="560" y1={40 + i * 50} y2={40 + i * 50} stroke={C.lineCool} strokeWidth="1" />
            ))}
            <path
              d="M0 190 C 70 186, 90 120, 150 130 S 240 70, 300 96 S 400 40, 460 62 S 530 30, 560 36"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
              style={{ filter: `drop-shadow(0 0 10px ${accent}88)` }}
            />
            <path
              d="M0 190 C 70 186, 90 120, 150 130 S 240 70, 300 96 S 400 40, 460 62 S 530 30, 560 36 L 560 240 L 0 240 Z"
              fill={`${accent}18`}
              opacity={draw}
            />
            {bars.map((b, i) => {
              const s = spring({ frame: frame - 30 - i * 6, fps, config: { damping: 14, mass: 0.7 } });
              return (
                <rect
                  key={i}
                  x={440 + i * 14}
                  y={240 - 160 * b * s}
                  width="9"
                  height={160 * b * s}
                  rx="3"
                  fill={i % 3 === 0 ? C.aqua : accent}
                  opacity="0.9"
                />
              );
            })}
          </svg>
        </Panel>
      </div>

      <div
        style={{
          marginTop: "auto",
          borderTop: `1px solid ${C.lineCool}`,
          borderBottom: `1px solid ${C.lineCool}`,
          padding: "14px 0",
          overflow: "hidden",
          fontFamily: font,
          fontSize: 16,
          letterSpacing: 3,
          color: C.dim,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ transform: `translateX(${ticker}px)` }}>
          HERMES ▸ EXECUTOR :8765 &nbsp;&nbsp;·&nbsp;&nbsp; PAPERCLIP ▸ CONTROL PLANE :3100 &nbsp;&nbsp;·&nbsp;&nbsp; MITHUNA ▸ BODY
          &amp; FACE :3000 &nbsp;&nbsp;·&nbsp;&nbsp; LIVE EVENTS ▸ /api/companies/:id/events/ws &nbsp;&nbsp;·&nbsp;&nbsp; TTS ▸ KOKORO
          &nbsp;&nbsp;·&nbsp;&nbsp; AR ▸ /ar-feature
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 3. Pipeline ---------------- */

const Node = ({ x, delay, title, subtitle, port, accent, tone }) => {
  const s = useAppear(delay);
  const frame = useCurrentFrame();
  const pulse = 0.55 + 0.45 * Math.sin((frame - delay) / 7);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 300,
        width: 300,
        height: 170,
        opacity: s,
        transform: `translateY(${(1 - s) * 26}px)`,
      }}
    >
      <Panel glow accent={tone} style={{ height: "100%", padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: font, fontSize: 24, letterSpacing: 3, color: C.champagne }}>{title}</div>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: tone, opacity: pulse, boxShadow: `0 0 14px ${tone}` }} />
        </div>
        <div style={{ fontFamily: font, fontSize: 15, letterSpacing: 2, color: C.dim, marginTop: 10 }}>{subtitle}</div>
        <div style={{ fontFamily: font, fontSize: 20, letterSpacing: 2, color: tone, marginTop: 14 }}>{port}</div>
      </Panel>
    </div>
  );
};

const Packet = ({ from, to, delay }) => {
  const frame = useCurrentFrame();
  const p = ((frame - delay) % 70) / 70;
  const active = frame > delay;
  const x = interpolate(p, [0, 1], [from, to]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 6,
        top: 379,
        width: 12,
        height: 12,
        borderRadius: 999,
        background: C.aqua,
        boxShadow: `0 0 18px ${C.aqua}`,
        opacity: active ? interpolate(p, [0, 0.1, 0.9, 1], [0, 1, 1, 0]) : 0,
      }}
    />
  );
};

const PipelineScene = ({ accent }) => {
  const frame = useCurrentFrame();
  const dash = interpolate(frame, [10, 110], [0, -60]);
  return (
    <AbsoluteFill style={{ padding: "64px 70px" }}>
      <Reticles />
      <Kicker accent>architecture</Kicker>
      <div style={{ fontFamily: font, fontSize: 40, color: C.champagne, marginTop: 10, letterSpacing: 2 }}>
        three pillars, one loop
      </div>
      <div style={{ fontFamily: font, fontSize: 17, color: C.dim, marginTop: 8, letterSpacing: 2 }}>
        executor → control plane → body &amp; face → back to reality
      </div>

      <Node x={40} delay={12} title="HERMES" subtitle="executor · brain" port=":8765" tone={C.aqua} />
      <Node x={490} delay={22} title="PAPERCLIP" subtitle="control plane · FSM" port=":3100" tone={accent} />
      <Node x={940} delay={32} title="MITHUNA" subtitle="body & face · AR" port=":3000" tone={C.periwinkle} />

      <svg style={{ position: "absolute", left: 0, top: 0, width: 1280, height: 720, pointerEvents: "none" }}>
        <line x1="340" y1="385" x2="490" y2="385" stroke={C.lineCool} strokeWidth="3" strokeDasharray="10 8" strokeDashoffset={dash} />
        <line x1="790" y1="385" x2="940" y2="385" stroke={C.lineCool} strokeWidth="3" strokeDasharray="10 8" strokeDashoffset={dash} />
        <path d="M1090 470 C 1090 600, 190 600, 190 470" fill="none" stroke={`${C.periwinkle}55`} strokeWidth="3" strokeDasharray="10 8" strokeDashoffset={-dash} />
      </svg>
      <Packet from={340} to={490} delay={20} />
      <Packet from={790} to={940} delay={44} />
      <Packet from={190} to={1090} delay={80} />

      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: font,
          fontSize: 16,
          letterSpacing: 3,
          color: C.dim,
          opacity: interpolate(frame, [70, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        state never forks · rendering never decides
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 4. AR feature ---------------- */

const ARScene = ({ accent }) => {
  const frame = useCurrentFrame();
  const phoneIn = useAppear(6);
  const walkPhase = frame > 40 && frame < 150;
  const talking = frame > 150 && frame < 200;
  const bullets = [
    "camera passthrough + tap-to-place",
    "procedural three.js characters · no external runtimes",
    "world modes · pedestal / grid / voxel market",
    "record the composite to webm/mp4",
  ];
  return (
    <AbsoluteFill style={{ padding: "56px 70px" }}>
      <Reticles />
      <Kicker accent>ar feature</Kicker>
      <div style={{ fontFamily: font, fontSize: 40, color: C.champagne, marginTop: 8, letterSpacing: 2 }}>
        characters in the real world
      </div>

      <div
        style={{
          position: "absolute",
          left: 96,
          top: 168,
          width: 320,
          height: 486,
          borderRadius: 40,
          border: `3px solid rgba(255,233,168,0.28)`,
          background: "linear-gradient(180deg, #101830 0%, #0b1120 100%)",
          overflow: "hidden",
          opacity: phoneIn,
          transform: `translateY(${(1 - phoneIn) * 30}px)`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.5), 0 0 60px ${accent}22`,
        }}
      >
        {/* fake camera feed */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #2b3a52 0%, #1b2436 55%, #101724 100%)" }} />
        <div style={{ position: "absolute", left: -30, top: 60, width: 220, height: 120, borderRadius: 16, background: "rgba(255,255,255,0.06)", filter: "blur(12px)" }} />
        <div style={{ position: "absolute", right: -40, top: 150, width: 200, height: 180, borderRadius: 20, background: "rgba(255,255,255,0.05)", filter: "blur(16px)" }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 190,
            backgroundImage: "linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            transform: "perspective(280px) rotateX(56deg)",
            transformOrigin: "top center",
            opacity: 0.55,
          }}
        />
        {/* pedestal */}
        <div
          style={{
            position: "absolute",
            left: 105,
            bottom: 62,
            width: 110,
            height: 26,
            borderRadius: "50%",
            border: `3px solid ${accent}`,
            boxShadow: `0 0 24px ${accent}66`,
            opacity: 0.85,
          }}
        />
        <VoxelMan talking={talking} walking={walkPhase} scale={0.82} style={{ left: 100, bottom: 66 }} />
        {/* HUD chips */}
        <div style={{ position: "absolute", left: 14, top: 14, display: "flex", gap: 8 }}>
          <Chip delay={20} on accent={C.aqua}>cam</Chip>
          <Chip delay={26} on accent={accent}>village</Chip>
        </div>
        <div style={{ position: "absolute", left: 14, bottom: 14, display: "flex", gap: 8 }}>
          <Chip delay={40} on={frame > 60} accent={accent}>walk</Chip>
          <Chip delay={46} on={talking} accent={C.aqua}>talk</Chip>
        </div>
        <div style={{ position: "absolute", right: 14, bottom: 14 }}>
          <Chip delay={52} on accent={C.periwinkle}>rec</Chip>
        </div>
      </div>

      <div style={{ position: "absolute", right: 80, top: 250, width: 640 }}>
        {bullets.map((b, i) => {
          const s = useAppear(30 + i * 14);
          return (
            <div
              key={b}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                marginBottom: 22,
                opacity: s,
                transform: `translateX(${(1 - s) * 28}px)`,
              }}
            >
              <div style={{ width: 14, height: 14, background: i % 2 ? C.aqua : accent, borderRadius: 3, boxShadow: `0 0 14px ${accent}66` }} />
              <div style={{ fontFamily: font, fontSize: 19, letterSpacing: 1.5, color: C.champagne }}>{b}</div>
            </div>
          );
        })}
        <div style={{ fontFamily: font, fontSize: 16, letterSpacing: 2, color: C.dim, marginTop: 18, opacity: useAppear(96) }}>
          route: <span style={{ color: accent }}>/ar-feature</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 5. Engage ---------------- */

const EngageScene = ({ accent }) => {
  const frame = useCurrentFrame();
  const s = useAppear(0);
  const pulse = 1 + 0.03 * Math.sin(frame / 5);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 26 }}>
      <Reticles />
      <Kicker color={accent}>engage</Kicker>
      <div
        style={{
          fontFamily: font,
          fontSize: 108,
          letterSpacing: 10,
          color: C.champagne,
          opacity: s,
          transform: `scale(${s * pulse})`,
        }}
      >
        ENTER THE CONSOLE
      </div>
      <div style={{ display: "flex", gap: 18, opacity: useAppear(16) }}>
        <Chip on accent={accent}>/simulation</Chip>
        <Chip on accent={C.aqua}>/ar-feature</Chip>
        <Chip accent={C.periwinkle}>/</Chip>
      </div>
      <div style={{ fontFamily: font, fontSize: 16, letterSpacing: 3, color: C.dim, opacity: useAppear(30) }}>
        react · three.js · remotion · vite — rendered programmatically
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- composition ---------------- */

export const MithunaShowcase = ({ accent = "amber" }) => {
  const tint = accent === "aqua" ? C.aqua : accent === "periwinkle" ? C.periwinkle : C.amber;
  return (
    <AbsoluteFill style={{ background: C.ink, fontFamily: font, overflow: "hidden" }}>
      <Backdrop accent={tint} />
      <Sequence from={SCENES[0].from} durationInFrames={SCENES[0].duration}><Fade duration={SCENES[0].duration}><TitleScene accent={tint} /></Fade></Sequence>
      <Sequence from={SCENES[1].from} durationInFrames={SCENES[1].duration}><Fade duration={SCENES[1].duration}><TelemetryScene accent={tint} /></Fade></Sequence>
      <Sequence from={SCENES[2].from} durationInFrames={SCENES[2].duration}><Fade duration={SCENES[2].duration}><PipelineScene accent={tint} /></Fade></Sequence>
      <Sequence from={SCENES[3].from} durationInFrames={SCENES[3].duration}><Fade duration={SCENES[3].duration}><ARScene accent={tint} /></Fade></Sequence>
      <Sequence from={SCENES[4].from} durationInFrames={SCENES[4].duration}><Fade duration={SCENES[4].duration}><EngageScene accent={tint} /></Fade></Sequence>
    </AbsoluteFill>
  );
};
