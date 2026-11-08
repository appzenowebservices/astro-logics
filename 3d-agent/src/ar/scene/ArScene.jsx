// Scene layer: transparent R3F canvas composited over the camera <video>.
// The camera is fixed (fallback AR): yaw billboard + ground projection make the
// sprite read as standing in the feed. Characters are Nischal sprite sheets;
// the world layer is either the holographic stage/grid or the voxel street.

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { SpriteBillboard } from "../character/SpriteBillboard";
import { PlacementController } from "../tracking/PlacementController";
import { ArWorld } from "../world/ArWorld";
import { VoxelStreet } from "../world/VoxelStreet";

function CanvasBridge({ onReady }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    onReady?.(gl.domElement);
  }, [gl, onReady]);
  return null;
}

export function ArScene({
  sheet,
  animation,
  scale,
  shadow,
  world,
  mirrored,
  targetRef,
  placedRef,
  epoch,
  onPlaced,
  onCanvasReady,
}) {
  return (
    <Canvas
      className="ar-canvas"
      style={{ background: "transparent" }}
      dpr={[1, 2]}
      gl={{
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      }}
      camera={{ fov: 60, position: [0, 1.5, 2.6], near: 0.05, far: 60 }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0.95, 0);
      }}
    >
      {world === "village" ? (
        <VoxelStreet />
      ) : (
        <ArWorld mode={world} targetRef={targetRef} scale={scale} />
      )}

      <SpriteBillboard
        sheet={sheet}
        animation={animation}
        scale={scale}
        shadow={shadow}
        targetRef={targetRef}
        epoch={epoch}
      />

      <PlacementController
        mirrored={mirrored}
        targetRef={targetRef}
        placedRef={placedRef}
        onPlaced={onPlaced}
      />
      <CanvasBridge onReady={onCanvasReady} />
    </Canvas>
  );
}
