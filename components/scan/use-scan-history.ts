"use client";

import { useEffect, useEffectEvent, useRef, type Dispatch } from "react";

import type { ScanFlowAction, ScanStep } from "@/components/scan/scan-flow-reducer";

type ScanHistoryState = { scanDepth?: number };

function urlFor(step: ScanStep): string {
  return step === "scanning" ? window.location.pathname : `?step=${step}`;
}

function depthOf(state: unknown): number {
  return (state as ScanHistoryState | null)?.scanDepth ?? 0;
}

/** Mirrors the flow in browser history so the back button steps back instead of leaving /scan. */
export function useScanHistory(step: ScanStep, depth: number, dispatch: Dispatch<ScanFlowAction>) {
  const browserDepth = useRef(0);

  // On mount (depth 0) this also drops a stale `?step=`, so a refresh starts over at the scanner.
  useEffect(() => {
    const entry = { scanDepth: depth };
    if (depth > browserDepth.current) {
      window.history.pushState(entry, "", urlFor(step));
    } else if (depth < browserDepth.current) {
      window.history.go(depth - browserDepth.current);
    } else {
      window.history.replaceState(entry, "", urlFor(step));
    }
    browserDepth.current = depth;
  }, [step, depth]);

  const onPopState = useEffectEvent((event: PopStateEvent) => {
    const target = depthOf(event.state);
    browserDepth.current = target;
    if (target < depth) {
      dispatch({ type: "BACK", depth: target });
    } else if (target > depth) {
      // Forward into a step that no longer exists: stay where the flow is.
      window.history.replaceState({ scanDepth: depth }, "", urlFor(step));
      browserDepth.current = depth;
    }
  });

  useEffect(() => {
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}
