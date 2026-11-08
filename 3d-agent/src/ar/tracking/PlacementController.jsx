// Tracking layer: pointer -> ground placement. Tap places the character;
// dragging (anywhere) grabs and moves it with pre-computed offset so the sprite
// does not jump under the finger. Writes straight into refs (no re-render per
// frame) and only notifies React on a fresh placement.

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clampPoint, screenToGround } from "./placement";

const DRAG_THRESHOLD_PX = 6;

export function PlacementController({ mirrored, targetRef, placedRef, onPlaced }) {
  const { camera, gl } = useThree();
  const mirroredRef = useRef(mirrored);
  const onPlacedRef = useRef(onPlaced);
  mirroredRef.current = mirrored;
  onPlacedRef.current = onPlaced;

  useEffect(() => {
    const el = gl.domElement;
    const hit = new THREE.Vector3();
    let active = null;

    const groundAt = (clientX, clientY) => {
      const rect = el.getBoundingClientRect();
      return screenToGround(clientX, clientY, rect, camera, mirroredRef.current, hit);
    };

    const onDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const point = groundAt(event.clientX, event.clientY);
      if (!point) return;
      event.preventDefault();

      const wasPlaced = placedRef.current;
      active = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
        offsetX: wasPlaced ? targetRef.current.x - point.x : 0,
        offsetZ: wasPlaced ? targetRef.current.z - point.z : 0,
      };
      el.setPointerCapture?.(event.pointerId);

      if (!wasPlaced) {
        targetRef.current = clampPoint(point.x, point.z);
        placedRef.current = true;
        onPlacedRef.current?.();
      }
    };

    const onMove = (event) => {
      if (!active || event.pointerId !== active.id) return;
      const dx = event.clientX - active.x;
      const dy = event.clientY - active.y;
      if (!active.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) active.moved = true;
      if (!active.moved) return;
      const point = groundAt(event.clientX, event.clientY);
      if (!point) return;
      targetRef.current = clampPoint(point.x + active.offsetX, point.z + active.offsetZ);
    };

    const onUp = (event) => {
      if (!active || event.pointerId !== active.id) return;
      active = null;
      el.releasePointerCapture?.(event.pointerId);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [camera, gl, targetRef, placedRef]);

  return null;
}
