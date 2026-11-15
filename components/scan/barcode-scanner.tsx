"use client";

import { useEffect } from "react";

import { getDetector } from "@/components/scan/barcode-detector";
import { CameraPreview } from "@/components/scan/camera-preview";
import { unlockBeep } from "@/components/scan/scan-beep";
import { CameraProblem } from "@/components/scan/scan-states";
import { useBarcodeDetection } from "@/components/scan/use-barcode-detection";
import { useCameraStream } from "@/components/scan/use-camera-stream";
import type { BarcodeFormat } from "@/lib/barcode/gtin";

type BarcodeScannerProps = {
  /** Keep the camera stream running (also while other screens are open). */
  streamEnabled: boolean;
  /** Look for barcodes; only on the scanning step. */
  detecting: boolean;
  onDetected: (code: string, format: BarcodeFormat | undefined) => void;
};

export function BarcodeScanner({ streamEnabled, detecting, onDetected }: BarcodeScannerProps) {
  const { videoRef, camera, retry: retryCamera } = useCameraStream(streamEnabled);
  const detection = useBarcodeDetection({
    videoRef,
    active: detecting && camera.kind === "live",
    onDetected,
  });

  useEffect(() => {
    unlockBeep();
    getDetector().catch(() => {});
    window.addEventListener("pointerdown", unlockBeep, { once: true });
    return () => window.removeEventListener("pointerdown", unlockBeep);
  }, []);

  const cameraProblem =
    camera.kind === "off" || camera.kind === "starting" || camera.kind === "live"
      ? null
      : camera.kind;
  const problem = cameraProblem ?? (detection.status === "failed" ? "error" : null);
  const loading = camera.kind !== "live" || detection.status !== "ready";

  // The video stays mounted under a problem card, so a retry keeps its element.
  return (
    <>
      {problem && (
        <CameraProblem kind={problem} onRetry={cameraProblem ? retryCamera : detection.retry} />
      )}
      <div hidden={problem !== null}>
        <CameraPreview videoRef={videoRef} loading={loading} />
      </div>
    </>
  );
}
