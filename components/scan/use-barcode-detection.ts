"use client";

import { useCallback, useEffect, useEffectEvent, useState, type RefObject } from "react";

import { getDetector, toProductFormat } from "@/components/scan/barcode-detector";
import { AIM_BOX } from "@/components/scan/camera-preview";
import { playBeep } from "@/components/scan/scan-beep";
import type { BarcodeFormat } from "@/lib/barcode/gtin";

export type DetectionStatus = "loading" | "ready" | "failed";

const SCAN_INTERVAL_MS = 100;
// A cut-off barcode can pass the single check digit by chance, but never the same way 3 times in a row.
const REQUIRED_READS = 3;
const STREAK_TIMEOUT_MS = 500;
const MAX_CROP_WIDTH = 1280;
// Extra room around the aiming box so a barcode a little outside it still reads.
const CROP_MARGIN = 0.1;

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

/** Reads barcodes from the live video while `active`; reports one code and then stops. */
export function useBarcodeDetection({
  videoRef,
  active,
  onDetected,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;
  onDetected: (code: string, format: BarcodeFormat | undefined) => void;
}) {
  const [status, setStatus] = useState<DetectionStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const reportCode = useEffectEvent(onDetected);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((count) => count + 1);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let cancelled = false;
    let frame = 0;
    let busy = false;
    let lastScan = 0;
    let streak = { code: "", count: 0, lastSeen: 0 };

    const start = async () => {
      let detector;
      try {
        detector = await getDetector();
      } catch {
        if (!cancelled) setStatus("failed");
        return;
      }
      if (cancelled) return;
      // The video was hidden on the other screens; make sure it's playing again.
      await video.play().catch(() => {});
      setStatus("ready");

      const tick = (now: number) => {
        frame = requestAnimationFrame(tick);
        if (busy || now - lastScan < SCAN_INTERVAL_MS || video.readyState < 2) return;
        if (!drawAimingBox(video, canvas, ctx)) return;
        lastScan = now;
        busy = true;
        detector
          .detect(canvas)
          .then((results) => {
            const result = results[0];
            if (!result?.rawValue || cancelled) return;
            const code = result.rawValue;
            const continues = code === streak.code && now - streak.lastSeen <= STREAK_TIMEOUT_MS;
            streak = { code, count: continues ? streak.count + 1 : 1, lastSeen: now };
            if (streak.count < REQUIRED_READS) return;
            cancelled = true;
            cancelAnimationFrame(frame);
            void playBeep();
            navigator.vibrate?.(80);
            reportCode(code, toProductFormat(result.format));
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
      cancelAnimationFrame(frame);
    };
  }, [active, attempt, videoRef]);

  return { status, retry };
}
