import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

function requestNextFrame(callback: FrameRequestCallback) {
  if (typeof requestAnimationFrame === "function") {
    return requestAnimationFrame(callback);
  }

  return window.setTimeout(() => callback(performance.now()), 16);
}

function cancelNextFrame(frameId: number) {
  if (typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(frameId);
    return;
  }

  window.clearTimeout(frameId);
}

export function useFrameScheduler<T>(apply: (value: T) => void) {
  const applyRef = useRef(apply);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<T | undefined>(undefined);

  useLayoutEffect(() => {
    applyRef.current = apply;
  }, [apply]);

  const flush = useCallback(() => {
    if (frameRef.current !== null) {
      cancelNextFrame(frameRef.current);
      frameRef.current = null;
    }

    const pending = pendingRef.current;
    pendingRef.current = undefined;

    if (pending !== undefined) {
      applyRef.current(pending);
    }
  }, []);

  const schedule = useCallback((value: T) => {
    pendingRef.current = value;

    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = requestNextFrame(() => {
      frameRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = undefined;

      if (pending !== undefined) {
        applyRef.current(pending);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelNextFrame(frameRef.current);
      }

      frameRef.current = null;
      pendingRef.current = undefined;
    };
  }, []);

  return { schedule, flush };
}
