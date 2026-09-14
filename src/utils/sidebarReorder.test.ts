import { describe, expect, it } from "vitest";
import { getDragAutoScrollAmount } from "./sidebarReorder";

describe("sidebar drag auto-scroll", () => {
  it("scrolls toward the nearest list edge", () => {
    expect(getDragAutoScrollAmount(5, 0, 300)).toBeLessThan(0);
    expect(getDragAutoScrollAmount(295, 0, 300)).toBeGreaterThan(0);
  });

  it("does not scroll while the pointer is away from the edges", () => {
    expect(getDragAutoScrollAmount(150, 0, 300)).toBe(0);
    expect(getDragAutoScrollAmount(0, 0, 0)).toBe(0);
  });
});
