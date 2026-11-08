// Camera layer: owns the getUserMedia lifecycle for the AR page.
// The <video> element stays mounted for the whole page life so the stream can
// always be attached synchronously from a user gesture (required on iOS).

import { useCallback, useEffect, useRef, useState } from "react";

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | starting | live | error
  const [error, setError] = useState(null);
  const [facing, setFacing] = useState("environment");
  const [demo, setDemo] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(
    async (nextFacing) => {
      const wanted = nextFacing ?? facing;
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera API unavailable. The page must be served over HTTPS — or use demo mode.");
        setStatus("error");
        return;
      }
      stopStream();
      setDemo(false);
      setError(null);
      setStatus("starting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: wanted },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setFacing(wanted);
        setStatus("live");
      } catch (err) {
        const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
        setError(
          denied
            ? "Camera permission denied. Allow it in the browser settings and retry, or use demo mode."
            : `Camera failed (${err?.name || "unknown error"}). Try demo mode.`
        );
        setStatus("error");
      }
    },
    [facing, stopStream]
  );

  const toggleFacing = useCallback(() => {
    const next = facing === "environment" ? "user" : "environment";
    if (status === "live") void start(next);
    else setFacing(next);
  }, [facing, status, start]);

  const enterDemo = useCallback(() => {
    stopStream();
    setDemo(true);
    setStatus("idle");
    setError(null);
  }, [stopStream]);

  useEffect(() => () => stopStream(), [stopStream]);

  return { videoRef, status, error, facing, demo, start, stopStream, toggleFacing, enterDemo };
}
