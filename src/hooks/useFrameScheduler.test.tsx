// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFrameScheduler } from "./useFrameScheduler";

describe("useFrameScheduler", () => {
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextFrameId = 1;

  beforeEach(() => {
    callbacks.clear();
    nextFrameId = 1;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        const frameId = nextFrameId++;
        callbacks.set(frameId, callback);
        return frameId;
      }),
    );
    vi.stubGlobal(
      "cancelAnimationFrame",
      vi.fn((frameId: number) => callbacks.delete(frameId)),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("coalesces rapid updates into the latest value for one frame", () => {
    const apply = vi.fn();
    const { result } = renderHook(() => useFrameScheduler(apply));

    act(() => {
      result.current.schedule({ x: 1 });
      result.current.schedule({ x: 2 });
      result.current.schedule({ x: 3 });
    });

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(apply).not.toHaveBeenCalled();

    act(() => callbacks.get(1)?.(16));
    expect(apply).toHaveBeenCalledExactlyOnceWith({ x: 3 });
  });

  it("flushes the last pending position when dragging stops", () => {
    const apply = vi.fn();
    const { result } = renderHook(() => useFrameScheduler(apply));

    act(() => {
      result.current.schedule({ x: 24 });
      result.current.flush();
    });

    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(apply).toHaveBeenCalledExactlyOnceWith({ x: 24 });
  });

  it("cancels pending work when the view unmounts", () => {
    const apply = vi.fn();
    const { result, unmount } = renderHook(() => useFrameScheduler(apply));

    act(() => result.current.schedule({ x: 8 }));
    unmount();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(apply).not.toHaveBeenCalled();
  });
});
