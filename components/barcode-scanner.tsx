"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Barcode, Check, RotateCcw, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Engine = "native" | "zxing";
type Status = "idle" | "starting" | "scanning" | "done" | "error";
type Scan = { code: string; format: string; engine: Engine };

/** Retail product barcodes: UPC/EAN, plus Code 128 for shelf labels. */
const NATIVE_FORMATS = ["upc_a", "upc_e", "ean_13", "ean_8", "code_128"];
const ZXING_FORMATS = [
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
];

const CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: false,
};

function describeError(err: unknown): string {
  if (!(err instanceof Error)) return "Could not start the camera.";
  switch (err.name) {
    case "NotAllowedError":
      return "Camera permission denied. Allow camera access for this site, then try again.";
    case "NotFoundError":
      return "No camera found on this device.";
    case "NotReadableError":
      return "The camera is in use by another app. Close it and try again.";
    case "OverconstrainedError":
      return "No camera matched the requested settings.";
    case "SecurityError":
      return "Blocked by the browser. The page must be served over HTTPS.";
    default:
      return err.message || "Could not start the camera.";
  }
}

export function BarcodeScanner() {
  const [status, setStatus] = useState<Status>("idle");
  const [active, setActive] = useState(false);
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<AudioContext | null>(null);

  /** Short scanner-style beep, synthesized so there's no asset to load. */
  const beep = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1046;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }, []);

  // Owns the camera for as long as `active` is true; cleanup tears everything down.
  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let controls: IScannerControls | null = null;
    let frame = 0;

    const stopAll = () => {
      if (cancelled) return;
      cancelled = true;
      cancelAnimationFrame(frame);
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };

    const onFound = (code: string, format: string, engine: Engine) => {
      if (cancelled) return;
      stopAll();
      beep();
      navigator.vibrate?.(120);
      setScan({ code, format, engine });
      setStatus("done");
      setActive(false);
    };

    const pollNative = (detector: BarcodeDetector) => {
      const tick = async () => {
        if (cancelled) return;
        try {
          const hit = (await detector.detect(video)).find((b) => b.rawValue);
          if (hit) {
            onFound(hit.rawValue, hit.format, "native");
            return;
          }
        } catch {
          // Transient decode failures are normal between frames — keep going.
        }
        if (!cancelled) frame = requestAnimationFrame(() => void tick());
      };
      void tick();
    };

    const start = async () => {
      try {
        // Undefined on insecure origins — the usual cause when testing on a phone.
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error("SecurityError"), {
            name: "SecurityError",
          });
        }

        const supported = window.BarcodeDetector
          ? await window.BarcodeDetector.getSupportedFormats()
          : [];
        const nativeFormats = NATIVE_FORMATS.filter((f) => supported.includes(f));

        if (window.BarcodeDetector && nativeFormats.length > 0) {
          const detector = new window.BarcodeDetector({ formats: nativeFormats });
          stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          video.srcObject = stream;
          await video.play();
          setStatus("scanning");
          pollNative(detector);
          return;
        }

        // iOS Safari / Firefox: decode in JS instead.
        const hints = new Map<DecodeHintType, unknown>([
          [DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS],
          [DecodeHintType.TRY_HARDER, true],
        ]);
        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 100,
        });
        controls = await reader.decodeFromConstraints(
          CONSTRAINTS,
          video,
          (result) => {
            if (result) {
              onFound(
                result.getText(),
                BarcodeFormat[result.getBarcodeFormat()],
                "zxing",
              );
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        setStatus("scanning");
      } catch (err) {
        if (cancelled) return;
        setError(describeError(err));
        setStatus("error");
        setActive(false);
      }
    };

    void start();
    return stopAll;
  }, [active, beep]);

  const handleScan = () => {
    // Create/resume the AudioContext on the tap so iOS lets the beep play later.
    audioRef.current ??= new AudioContext();
    void audioRef.current.resume();
    setError(null);
    setScan(null);
    setStatus("starting");
    setActive(true);
  };

  const handleCancel = () => {
    setActive(false);
    setStatus("idle");
  };

  const live = status === "starting" || status === "scanning";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight">
          Shelf Watch
        </h1>
        <p className="text-sm text-muted-foreground">
          Barcode scan test — point the back camera at a product.
        </p>
      </header>

      {live && (
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border bg-black">
            <video
              ref={videoRef}
              className="size-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {/* Aiming guide */}
            <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2">
              <div className="h-28 rounded-lg border-2 border-white/70 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-red-500/90" />
            </div>
            <p className="absolute inset-x-0 bottom-3 text-center text-xs font-medium text-white/90">
              {status === "starting"
                ? "Starting camera…"
                : "Hold steady over the barcode"}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-12 w-full text-base"
            onClick={handleCancel}
          >
            <X />
            Cancel
          </Button>
        </div>
      )}

      {status === "done" && scan && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-6" />
            </span>
            <p className="text-sm font-medium text-foreground">Barcode found</p>
            <p className="font-mono text-3xl font-semibold tracking-wider tabular-nums break-all">
              {scan.code}
            </p>
            <p className="text-xs text-muted-foreground">
              {scan.format.toUpperCase().replace(/_/g, "-")} · decoded by{" "}
              {scan.engine === "native" ? "BarcodeDetector" : "ZXing"}
            </p>
          </div>
          <Button className="h-12 w-full text-base" onClick={handleScan}>
            <RotateCcw />
            Scan again
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <Button className="h-12 w-full text-base" onClick={handleScan}>
            <RotateCcw />
            Try again
          </Button>
        </div>
      )}

      {status === "idle" && (
        <Button className="h-14 w-full text-base" onClick={handleScan}>
          <Barcode className="size-5" />
          Scan
        </Button>
      )}
    </div>
  );
}
