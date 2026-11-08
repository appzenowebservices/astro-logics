// Remotion showcase — shared visual bits (backdrop, chips, counters, charts,
// and a fully CSS-built voxel character that walks/talks on the timeline).

import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const font = "ui-monospace, 'Cascadia Code', 'Segoe UI', monospace";

export const C = {
  ink: "#070b14",
  panel: "rgba(19, 27, 48, 0.72)",
  panelDeep: "rgba(7, 11, 20, 0.7)",
  line: "rgba(246, 173, 63, 0.28)",
  lineCool: "rgba(148, 163, 184, 0.22)",
  champagne: "#ffe9b8",
  dim: "rgba(255, 233, 184, 0.62)",
  amber: "#f6ad3f",
  aqua: "#5eead4",
  periwinkle: "#8b9cf9",
  green: "#34d399",
  red: "#fb7185",
};

export const Grid = ({ opacity = 0.16, size = 48 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity,
      backgroundImage:
        "linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px)",
      backgroundSize: `${size}px ${size}px`,
    }}
  />
);

export const Scanlines = ({ opacity = 0.1 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity,
      background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.55) 4px)",
    }}
  />
);

export const Vignette = () => (
  <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 200px rgba(0,0,0,0.6)" }} />
);

export const Backdrop = ({ accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const x = interpolate(frame, [0, durationInFrames], [22, 78]);
  const y = interpolate(frame, [0, durationInFrames], [26, 68]);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(55% 42% at ${x}% ${y}%, ${accent}26, transparent 70%), linear-gradient(180deg, #0b1120 0%, ${C.ink} 58%, #0b1120 100%)`,
        }}
      />
      <Grid />
      <Scanlines />
      <Vignette />
    </AbsoluteFill>
  );
};

export const Panel = ({ children, style, glow = false, accent = C.amber }) => (
  <div
    style={{
      background: `linear-gradient(180deg, rgba(255,255,255,0.04), transparent 45%), ${C.panel}`,
      border: `1px solid ${glow ? accent + "66" : C.lineCool}`,
      borderRadius: 18,
      boxShadow: glow ? `0 0 40px ${accent}22` : "0 18px 50px rgba(0,0,0,0.35)",
      backdropFilter: "blur(14px)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Kicker = ({ children, color = C.amber, style }) => (
  <div style={{ fontFamily: font, fontSize: 18, letterSpacing: 5, color, textTransform: "uppercase", ...style }}>
    {children}
  </div>
);

export const Reveal = ({ text, delay = 0, stagger = 2, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={style}>
      {text.split("").map((ch, i) => {
        const p = interpolate(frame, [delay + i * stagger, delay + i * stagger + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: ch === " " ? "pre" : undefined,
              opacity: p,
              transform: `translateY(${(1 - p) * 22}px)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export const Counter = ({ to, delay = 0, duration = 45, decimals = 0, prefix = "", suffix = "" }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [delay, delay + duration], [0, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </>
  );
};

export const Chip = ({ children, on = false, accent = C.amber, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        display: "inline-block",
        padding: "10px 18px",
        borderRadius: 999,
        fontFamily: font,
        fontSize: 17,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: on ? "#1a0e02" : C.champagne,
        background: on ? accent : "rgba(19,27,48,0.7)",
        border: `1px solid ${on ? accent : C.lineCool}`,
        boxShadow: on ? `0 0 24px ${accent}55` : "none",
        opacity: s,
        transform: `translateY(${(1 - s) * 16}px) scale(${0.9 + s * 0.1})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ---------------- CSS voxel character ---------------- */

const P = {
  hair: "#241A14",
  hairHi: "#3A2A1E",
  skin: "#C98A5B",
  skinD: "#A86F45",
  skinL: "#E2AB79",
  kurta: "#4A86C8",
  pat: "#CFE3F0",
  vest: "#3A3D42",
  btn: "#1E2126",
  pin: "#C0392B",
  pants: "#F2F0EA",
  sandal: "#7A4A24",
  sole: "#5A3418",
  bag: "#C9A76B",
  bagRed: "#B5502A",
  bagCream: "#E8D9B8",
  strap: "#4A4A4A",
  dark: "#141821",
  white: "#F5F2EA",
};

const Box = ({ x, y, w, h, c, r = 2, o = 0.35, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      background: c,
      borderRadius: r,
      boxShadow: o ? `inset 0 0 0 1px rgba(0,0,0,${o})` : undefined,
      ...style,
    }}
  />
);

export const VoxelMan = ({ talking = false, walking = false, scale = 1, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const legSwing = walking ? Math.sin(t * 6.2) * 9 : 0;
  const armSwing = walking ? Math.sin(t * 6.2) * 14 : Math.sin(t * 1.3) * 2;
  const bob = walking ? Math.abs(Math.sin(t * 6.2)) * 2.4 : Math.sin(t * 1.3) * 0.9;
  const mouth = talking ? 3 + 8 * Math.abs(Math.sin(t * 9)) : 3.5;

  const leg = (x, s) => (
    <div
      key={x}
      style={{
        position: "absolute",
        left: x,
        top: 148,
        width: 17,
        height: 66,
        transformOrigin: "top center",
        transform: `rotate(${s}deg)`,
      }}
    >
      <Box x={1} y={0} w={14} h={48} c={P.pants} o={0.18} />
      <Box x={0} y={46} w={16} h={12} c={P.sandal} />
      <Box x={0} y={56} w={17} h={7} c={P.sole} />
    </div>
  );

  const arm = (x, s, dir) => (
    <div
      key={x}
      style={{
        position: "absolute",
        left: x,
        top: 82,
        width: 12,
        height: 54,
        transformOrigin: "top center",
        transform: `rotate(${s}deg)`,
      }}
    >
      <Box x={0} y={0} w={11} h={40} c={P.kurta} o={0.2} />
      <Box x={0} y={40} w={10} h={11} c={P.skin} o={0.25} />
    </div>
  );

  return (
    <div style={{ position: "absolute", width: 120, height: 215, transform: `translateY(${bob}px) scale(${scale})`, ...style }}>
      {leg(43, legSwing)}
      {leg(61, -legSwing)}
      {/* bag */}
      <Box x={16} y={112} w={24} h={34} c={P.bag} />
      <Box x={18} y={120} w={20} h={5} c={P.bagCream} o={0} />
      <Box x={18} y={130} w={20} h={5} c={P.bagRed} o={0} />
      <Box x={18} y={139} w={20} h={5} c={P.bagCream} o={0} />
      {/* kurta + vest */}
      <Box x={31} y={86} w={58} h={68} c={P.kurta} />
      <Box x={28} y={146} w={64} h={12} c={P.kurta} r={4} />
      <Box x={33} y={78} w={54} h={62} c={P.vest} r={4} />
      <Box x={78} y={100} w={10} h={8} c={P.pin} r={2} o={0} />
      <Box x={34} y={86} w={6} h={6} c={P.pat} o={0} />
      <Box x={82} y={112} w={6} h={6} c={P.pat} o={0} />
      <Box x={44} y={120} w={6} h={6} c={P.pat} o={0} />
      <Box x={70} y={126} w={6} h={6} c={P.pat} o={0} />
      {/* strap */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 84,
          width: 11,
          height: 62,
          background: P.strap,
          borderRadius: 3,
          transform: "rotate(-42deg)",
          transformOrigin: "center",
        }}
      />
      {/* arms */}
      {arm(19, armSwing * 0.5, -1)}
      {arm(89, -armSwing, 1)}
      {/* neck + head */}
      <Box x={51} y={64} w={18} h={18} c={P.skin} o={0.25} />
      <Box x={36} y={12} w={48} h={54} c={P.skin} r={4} />
      {/* hair */}
      <Box x={33} y={6} w={54} h={16} c={P.hair} r={5} o={0.3} />
      <Box x={33} y={20} w={8} h={26} c={P.hair} r={4} o={0.3} />
      <Box x={79} y={20} w={8} h={26} c={P.hair} r={4} o={0.3} />
      <Box x={40} y={4} w={12} h={8} c={P.hairHi} r={4} o={0} />
      <Box x={66} y={6} w={10} h={7} c={P.hairHi} r={4} o={0} />
      <Box x={52} y={2} w={10} h={7} c={P.hair} r={4} o={0.2} />
      {/* brows */}
      <Box x={42} y={30} w={14} h={4} c={P.hair} o={0} r={1} />
      <Box x={64} y={30} w={14} h={4} c={P.hair} o={0} r={1} />
      {/* eyes */}
      <Box x={43} y={36} w={12} h={9} c={P.white} o={0.15} r={1} />
      <Box x={65} y={36} w={12} h={9} c={P.white} o={0.15} r={1} />
      <Box x={47} y={37} w={6} h={7} c={C.dark} o={0} r={1} />
      <Box x={69} y={37} w={6} h={7} c={C.dark} o={0} r={1} />
      {/* nose */}
      <Box x={56} y={43} w={8} h={11} c={P.skinD} r={2} o={0.25} />
      {/* beard */}
      <Box x={36} y={48} w={48} h={12} c={P.hair} r={4} o={0.3} />
      <Box x={38} y={58} w={44} h={10} c={P.hair} r={4} o={0.3} />
      {/* mouth (animated when talking) */}
      <Box x={52} y={49} w={16} h={mouth} c="#4a241f" r={2} o={0} />
      <Box x={54} y={50} w={12} h={Math.min(3.5, mouth)} c={P.white} r={1} o={0} />
      {talking ? <Box x={56} y={50 + mouth} w={8} h={4} c={C.red} r={1} o={0} /> : null}
      {/* strap highlight + buckle */}
      <Box x={60} y={128} w={7} h={7} c={C.amber} r={2} o={0} />
    </div>
  );
};
