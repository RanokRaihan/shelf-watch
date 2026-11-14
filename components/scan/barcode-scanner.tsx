"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getDetector } from "@/components/scan/barcode-detector";
import { AIM_BOX, CameraPreview } from "@/components/scan/camera-preview";
import { playBeep, unlockBeep } from "@/components/scan/scan-beep";
import {
  CameraProblem,
  type CameraProblemKind,
  ScanResult,
} from "@/components/scan/scan-states";

type Status =
  | { kind: "starting" }
  | { kind: "scanning" }
  | { kind: CameraProblemKind }
  | { kind: "scanned"; code: string };

const CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: false,
};

const SCAN_INTERVAL_MS = 100;
// A cut-off barcode can pass the single check digit by chance, but never the same way 3 times in a row.
const REQUIRED_READS = 3;
const STREAK_TIMEOUT_MS = 500;
const MAX_CROP_WIDTH = 1280;
// Extra room around the aiming box so a barcode a little outside it still reads.
const CROP_MARGIN = 0.1;

function problemFor(error: unknown): CameraProblemKind {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "no-camera";
  if (name === "NotReadableError" || name === "AbortError") return "in-use";
  return "error";
}

// Draws the part of the video under the aiming box, accounting for object-cover.
function drawAimingBox(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  const { videoWidth: vw, videoHeight: vh, clientWidth: cw, clientHeight: ch } = video;
  if (!vw || !vh || !cw || !ch) return false;

  const scale = Math.max(cw / vw, ch / vh);
  const offsetX = (cw - vw * scale) / 2;
  const offsetY = (ch - vh * scale) / 2;
  const boxW = cw * Math.min(1, AIM_BOX.width + CROP_MARGIN * 2);
  const boxH = ch * Math.min(1, AIM_BOX.height + CROP_MARGIN * 2);

  const sx = Math.max(0, ((cw - boxW) / 2 - offsetX) / scale);
  const sy = Math.max(0, ((ch - boxH) / 2 - offsetY) / scale);
  const sw = Math.min(vw - sx, boxW / scale);
  const sh = Math.min(vh - sy, boxH / scale);

  const outScale = Math.min(1, MAX_CROP_WIDTH / sw);
  canvas.width = Math.round(sw * outScale);
  canvas.height = Math.round(sh * outScale);
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return true;
}

export function BarcodeScanner() {
  const [status, setStatus] = useState<Status>({ kind: "starting" });
  const [attempt, setAttempt] = useState(0);
  const [hidden, setHidden] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const cameraOn = (status.kind === "starting" || status.kind === "scanning") && !hidden;

  const restart = useCallback(() => {
    unlockBeep();
    setStatus({ kind: "starting" });
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    unlockBeep();
    window.addEventListener("pointerdown", unlockBeep, { once: true });
    return () => window.removeEventListener("pointerdown", unlockBeep);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      const isHidden = document.visibilityState === "hidden";
      setHidden(isHidden);
      if (!isHidden) setStatus((s) => (s.kind === "scanning" ? { kind: "starting" } : s));
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!cameraOn) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let frame = 0;
    let busy = false;
    let lastScan = 0;
    let streak = { code: "", count: 0, lastSeen: 0 };
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const stop = () => {
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setStatus({ kind: "unsupported" });
        return;
      }

      const detectorReady = getDetector();
      detectorReady.catch(() => {});

      try {
        stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
      } catch (error) {
        if (!cancelled) setStatus({ kind: problemFor(error) });
        return;
      }
      const video = videoRef.current;
      if (cancelled || !video || !ctx) {
        stop();
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});

      let detector;
      try {
        detector = await detectorReady;
      } catch {
        if (!cancelled) {
          stop();
          setStatus({ kind: "error" });
        }
        return;
      }
      if (cancelled) return;
      setStatus({ kind: "scanning" });

      const tick = (now: number) => {
        frame = requestAnimationFrame(tick);
        if (busy || now - lastScan < SCAN_INTERVAL_MS || video.readyState < 2) return;
        if (!drawAimingBox(video, canvas, ctx)) return;
        lastScan = now;
        busy = true;
        detector
          .detect(canvas)
          .then((results) => {
            const code = results[0]?.rawValue;
            if (!code || cancelled) return;
            const continues = code === streak.code && now - streak.lastSeen <= STREAK_TIMEOUT_MS;
            streak = { code, count: continues ? streak.count + 1 : 1, lastSeen: now };
            if (streak.count < REQUIRED_READS) return;
            cancelled = true;
            stop();
            void playBeep();
            navigator.vibrate?.(80);
            setStatus({ kind: "scanned", code });
          })
          .catch(() => {})
          .finally(() => {
            busy = false;
          });
      };
      frame = requestAnimationFrame(tick);
    };

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [cameraOn, attempt]);

  // Chrome reports a permission change, so a re-allowed camera restarts on its own.
  useEffect(() => {
    if (status.kind !== "denied" || !navigator.permissions) return;
    let permission: PermissionStatus | null = null;
    let active = true;
    navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then((result) => {
        if (!active) return;
        permission = result;
        result.onchange = () => {
          if (result.state === "granted") restart();
        };
      })
      .catch(() => {});
    return () => {
      active = false;
      if (permission) permission.onchange = null;
    };
  }, [status.kind, restart]);

  if (status.kind === "scanned") {
    return <ScanResult code={status.code} onScanAgain={restart} />;
  }
  if (status.kind === "starting" || status.kind === "scanning") {
    return <CameraPreview videoRef={videoRef} loading={status.kind === "starting"} />;
  }
  return <CameraProblem kind={status.kind} onRetry={restart} />;
}
