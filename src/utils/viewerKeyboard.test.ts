import { describe, expect, it } from "vitest";
import {
  getTransformKeyboardAction,
  getViewerKeyboardAction,
} from "./viewerKeyboard";

describe("getTransformKeyboardAction", () => {
  it.each([
    ["+", "zoom-in"],
    ["=", "zoom-in"],
    ["-", "zoom-out"],
    ["0", "reset-view"],
    ["Home", "reset-view"],
    ["r", "rotate-clockwise"],
    ["R", "rotate-clockwise"],
  ] as const)("maps %s to a transform action", (key, expectedAction) => {
    expect(getTransformKeyboardAction(key)).toBe(expectedAction);
  });

  it("leaves unrelated keys available to the current mode", () => {
    expect(getTransformKeyboardAction("ArrowRight")).toBeNull();
  });
});

describe("getViewerKeyboardAction", () => {
  it.each([
    ["+", "zoom-in"],
    ["=", "zoom-in"],
    ["-", "zoom-out"],
    ["0", "reset-view"],
    ["Home", "reset-view"],
    ["r", "rotate-clockwise"],
    ["R", "rotate-clockwise"],
    ["ArrowLeft", "select-previous"],
    ["ArrowRight", "select-next"],
  ] as const)("maps %s in single-image mode", (key, expectedAction) => {
    expect(
      getViewerKeyboardAction({ key, viewMode: "single", imageCount: 2 }),
    ).toBe(expectedAction);
  });

  it.each(["compare", "grid"] as const)(
    "does not mutate the hidden single-image transform in %s mode",
    (viewMode) => {
      expect(
        getViewerKeyboardAction({ key: "+", viewMode, imageCount: 2 }),
      ).toBeNull();
      expect(
        getViewerKeyboardAction({ key: "0", viewMode, imageCount: 2 }),
      ).toBeNull();
      expect(
        getViewerKeyboardAction({ key: "r", viewMode, imageCount: 2 }),
      ).toBeNull();
    },
  );

  it("allows Escape to stop panning in every mode", () => {
    expect(
      getViewerKeyboardAction({
        key: "Escape",
        viewMode: "compare",
        imageCount: 2,
      }),
    ).toBe("stop-panning");
  });

  it("does not navigate an empty image list", () => {
    expect(
      getViewerKeyboardAction({
        key: "ArrowRight",
        viewMode: "single",
        imageCount: 0,
      }),
    ).toBeNull();
  });
});
