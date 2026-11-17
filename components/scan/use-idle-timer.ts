"use client";

import { useEffect, useEffectEvent } from "react";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "input", "scroll"] as const;

/** Calls `onIdle` once after `timeoutMs` with no user activity, while `enabled`. */
export function useIdleTimer(enabled: boolean, timeoutMs: number, onIdle: () => void) {
  const fireIdle = useEffectEvent(onIdle);

  useEffect(() => {
    if (!enabled) return;
    let timer = window.setTimeout(fireIdle, timeoutMs);
    const restart = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fireIdle, timeoutMs);
    };
    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, restart, { passive: true, capture: true });
    }
    return () => {
      window.clearTimeout(timer);
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, restart, { capture: true });
      }
    };
  }, [enabled, timeoutMs]);
}
