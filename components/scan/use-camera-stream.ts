"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CameraProblemKind } from "@/components/scan/scan-states";

export type CameraState =
  | { kind: "off" }
  | { kind: "starting" }
  | { kind: "live" }
  | { kind: CameraProblemKind };

const CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: false,
};

function problemFor(error: unknown): CameraProblemKind {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "no-camera";
  if (name === "NotReadableError" || name === "AbortError") return "in-use";
  return "error";
}

function usePageHidden() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  return hidden;
}

/** Runs the camera stream into `videoRef` while `enabled` and the page is visible. */
export function useCameraStream(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>({ kind: "starting" });
  const [attempt, setAttempt] = useState(0);
  const pageHidden = usePageHidden();
  const wanted = enabled && !pageHidden;

  const retry = useCallback(() => {
    setState({ kind: "starting" });
    setAttempt((count) => count + 1);
  }, []);

  useEffect(() => {
    if (!wanted) return;
    let cancelled = false;
    let stream: MediaStream | null = null;

    const stop = () => {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setState({ kind: "unsupported" });
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
      } catch (error) {
        if (!cancelled) setState({ kind: problemFor(error) });
        return;
      }
      const video = videoRef.current;
      if (cancelled || !video) {
        stop();
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});
      if (!cancelled) setState({ kind: "live" });
    };

    void start();
    return () => {
      cancelled = true;
      stop();
      setState({ kind: "starting" });
    };
  }, [wanted, attempt]);

  // Chrome reports a permission change, so a re-allowed camera restarts on its own.
  useEffect(() => {
    if (state.kind !== "denied" || !navigator.permissions) return;
    let permission: PermissionStatus | null = null;
    let active = true;
    navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then((result) => {
        if (!active) return;
        permission = result;
        result.onchange = () => {
          if (result.state === "granted") retry();
        };
      })
      .catch(() => {});
    return () => {
      active = false;
      if (permission) permission.onchange = null;
    };
  }, [state.kind, retry]);

  const camera: CameraState = wanted ? state : { kind: "off" };
  return { videoRef, camera, retry };
}
