import { describe, expect, it } from "vitest";
import {
  clampZoom,
  composeTransforms,
  DEFAULT_TRANSFORM,
  zoomAtPoint,
} from "./imageTransforms";

describe("clampZoom", () => {
  it("limits zoom to the supported range", () => {
    expect(clampZoom(-20)).toBe(10);
    expect(clampZoom(175)).toBe(175);
    expect(clampZoom(900)).toBe(500);
  });
});

describe("zoomAtPoint", () => {
  it("keeps the image point below the pointer stationary", () => {
    expect(
      zoomAtPoint(
        { zoom: 100, x: 10, y: -20, rotation: 90 },
        200,
        50,
        30,
      ),
    ).toEqual({ zoom: 200, x: -30, y: -70, rotation: 90 });
  });

  it("preserves object identity when zoom does not change", () => {
    expect(zoomAtPoint(DEFAULT_TRANSFORM, 100, 20, 30)).toBe(
      DEFAULT_TRANSFORM,
    );
  });
});

describe("composeTransforms", () => {
  it("combines synchronized and per-image adjustments", () => {
    expect(
      composeTransforms(
        { zoom: 200, x: 30, y: -10, rotation: 90 },
        { zoom: 50, x: 8, y: 12, rotation: 270 },
      ),
    ).toEqual({ zoom: 1, x: 46, y: 14, rotation: 0 });
  });

  it("leaves an image unchanged when both transforms are defaults", () => {
    expect(composeTransforms(DEFAULT_TRANSFORM, DEFAULT_TRANSFORM)).toEqual({
      zoom: 1,
      x: 0,
      y: 0,
      rotation: 0,
    });
  });
});
