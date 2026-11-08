// src/app/App.jsx

import { Component, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Engine } from "../simulation/Engine";
import { PhoneFrame } from "../ui/PhoneFrame";
import { DesktopLayout } from "../ui/DesktopLayout";
import { NoWebGL } from "../ui/NoWebGL";
import { useIsMobile } from "../hooks/useIsMobile";
import { paperclipStore, usePaperclipStore } from "../networking/sync/paperclipStore";
import { startAstro } from "../astro/astroStore";
import { ensureTts, warmupAudio } from "../services/tts/kokoro";

function webglSupported() {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

class CanvasBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <NoWebGL
          onRetry={() => {
            if (webglSupported()) this.setState({ failed: false });
          }}
        />
      );
    }
    return this.props.children;
  }
}

function PaperclipBridge() {
  const connected = usePaperclipStore((s) => s.connected);

  // Connect on mount, then keep retrying while disconnected (every 5s, one
  // attempt at a time). Starting or restarting the control panel after the page
  // has loaded therefore fills the company dropdown without a manual refresh.
  useEffect(() => {
    if (connected) return undefined;
    let cancelled = false;
    let timer = null;

    const attempt = async () => {
      await paperclipStore.connect("The Delegation");
      if (cancelled) return;
      if (!paperclipStore.getState().connected) {
        timer = setTimeout(attempt, 5000);
      }
    };

    void attempt();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [connected]);

  useEffect(() => {
    if (!connected) return;
    return paperclipStore.subscribeToEvents();
  }, [connected]);

  return null;
}

/**
 * Starts the Kaalvanta chart feed. Lives outside the Canvas so the HUD and the
 * 3D layer share one polling loop.
 */
function AstroBridge() {
  useEffect(() => {
    startAstro();
  }, []);
  return null;
}

function TtsWarmup() {
  useEffect(() => {
    // The browser only allows audio to start after a user gesture. Kick off the
    // (cached) ~300MB model download + AudioContext on the first click/keypress.
    const warm = () => {
      warmupAudio();
      ensureTts();
    };
    window.addEventListener("pointerdown", warm, { once: true });
    window.addEventListener("keydown", warm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
    };
  }, []);

  return null;
}

function SimulationCanvas() {
  const [supported, setSupported] = useState(() => webglSupported());

  if (!supported) {
    return (
      <NoWebGL
        onRetry={() => {
          if (webglSupported()) setSupported(true);
        }}
      />
    );
  }

  return (
    <CanvasBoundary>
      <Canvas
        shadows
        gl={{ alpha: false }}
        camera={{
          position: [5, 5, 5],
          fov: 60,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <Engine />
      </Canvas>
    </CanvasBoundary>
  );
}

export default function App() {
  const isMobile = useIsMobile();

  return isMobile ? (
    <PhoneFrame>
      <PaperclipBridge />
      <AstroBridge />
      <TtsWarmup />
      <SimulationCanvas />
    </PhoneFrame>
  ) : (
    <DesktopLayout>
      <PaperclipBridge />
      <AstroBridge />
      <TtsWarmup />
      <SimulationCanvas />
    </DesktopLayout>
  );
}