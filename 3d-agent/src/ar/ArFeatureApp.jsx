// /ar-feature — mobile-first sprite character compositing page.
// Layers: camera (video), scene (transparent R3F), tracking (placement),
// character (Nischal sprite sheets in public/sprite), world (pedestal/grid or
// voxel street), UI (HUD), export (recorder).

import { Component, useCallback, useEffect, useRef, useState } from "react";
import "../ui/simhud.css";
import "./ar.css";
import { useCamera } from "./camera/useCamera";
import { ArScene } from "./scene/ArScene";
import { ArHud } from "./ui/ArHud";
import { CHARACTER_KEYS, animationsOf, resolveCharacter } from "./assets/characters";
import { useRecorder } from "./export/useRecorder";

class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="ar-fallback">
          <b>WebGL unavailable</b>
          <span>This device or browser cannot render the AR scene.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ArFeatureApp() {
  const camera = useCamera();
  const [characterKey, setCharacterKey] = useState(CHARACTER_KEYS[0]);
  const [animation, setAnimation] = useState("idle");
  const [scale, setScale] = useState(1);
  const [shadow, setShadow] = useState(true);
  const [world, setWorld] = useState("village");
  const [mirrored, setMirrored] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [epoch, setEpoch] = useState(0);

  const sheet = resolveCharacter(characterKey);
  const animations = animationsOf(sheet);

  const targetRef = useRef({ x: 0, z: 0 });
  const placedRef = useRef(false);
  const glRef = useRef(null);

  const live = camera.status === "live";
  const starting = camera.status === "starting";

  useEffect(() => {
    setMirrored(camera.facing === "user");
  }, [camera.facing]);

  const handleCharacter = useCallback((key) => {
    setCharacterKey(key);
    const next = resolveCharacter(key);
    setAnimation((current) => (next[current] ? current : "idle"));
    setEpoch((value) => value + 1);
  }, []);

  const handleWorld = useCallback(() => {
    setWorld((mode) =>
      mode === "off"
        ? "stage"
        : mode === "stage"
          ? "all"
          : mode === "all"
            ? "village"
            : "off"
    );
  }, []);

  const handlePlaced = useCallback(() => {
    setPlaced(true);
    setEpoch((value) => value + 1);
  }, []);

  const handleReset = useCallback(() => {
    placedRef.current = false;
    targetRef.current = { x: 0, z: 0 };
    setPlaced(false);
  }, []);

  const handleCanvasReady = useCallback((element) => {
    glRef.current = element;
  }, []);

  const isMirrored = useCallback(() => mirrored, [mirrored]);

  const recorder = useRecorder({
    videoRef: camera.videoRef,
    glRef,
    isMirrored,
  });

  const handleRecord = useCallback(() => {
    if (recorder.recording) recorder.stop();
    else recorder.start();
  }, [recorder]);

  return (
    <div className={`ar-root ${mirrored ? "mirrored" : ""}`}>
      <video
        ref={camera.videoRef}
        className={`ar-video ${live ? "live" : ""}`}
        playsInline
        muted
        autoPlay
      />

      {!live ? <div className="ar-demo-bg" /> : null}

      <div className="ar-stage">
        <SceneBoundary>
          <ArScene
            sheet={sheet}
            animation={animation}
            scale={scale}
            shadow={shadow}
            world={world}
            mirrored={mirrored}
            targetRef={targetRef}
            placedRef={placedRef}
            epoch={epoch}
            onPlaced={handlePlaced}
            onCanvasReady={handleCanvasReady}
          />
        </SceneBoundary>
      </div>

      <div className="scanlines" />
      <div className="vignette" />

      <ArHud
        live={live}
        demo={camera.demo}
        starting={starting}
        error={camera.error}
        facing={camera.facing}
        mirrored={mirrored}
        placed={placed}
        sheet={sheet}
        character={characterKey}
        characters={CHARACTER_KEYS}
        animations={animations}
        animation={animation}
        scale={scale}
        shadow={shadow}
        world={world}
        recorderSupported={recorder.supported}
        recording={recorder.recording}
        elapsed={recorder.elapsed}
        lastExport={recorder.lastExport}
        onStart={() => void camera.start()}
        onDemo={camera.enterDemo}
        onToggleFacing={camera.toggleFacing}
        onToggleMirror={() => setMirrored((value) => !value)}
        onToggleShadow={() => setShadow((value) => !value)}
        onWorld={handleWorld}
        onCharacter={handleCharacter}
        onAnimation={setAnimation}
        onScale={setScale}
        onRecord={handleRecord}
        onReset={handleReset}
      />
    </div>
  );
}
