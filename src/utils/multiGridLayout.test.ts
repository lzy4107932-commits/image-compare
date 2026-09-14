import { describe, expect, it } from "vitest";
import {
  getMultiGridCardBasis,
  getMultiGridCardHeight,
  getPreferredMultiGridColumns,
  getResponsiveMultiGridColumns,
} from "./multiGridLayout";

describe("multi-image grid layout", () => {
  it.each([
    [3, 3],
    [4, 2],
    [5, 3],
    [6, 3],
    [7, 4],
    [8, 4],
    [9, 3],
    [12, 4],
  ])("uses a balanced layout for %i images", (imageCount, columns) => {
    expect(getPreferredMultiGridColumns(imageCount)).toBe(columns);
  });

  it("builds an equal-width responsive card basis", () => {
    expect(getMultiGridCardBasis(3)).toBe(
      "min(100%, max(220px, calc(33.333333% - 1.333333px)))",
    );
    expect(getMultiGridCardBasis(2)).toBe(
      "min(100%, max(220px, calc(50% - 1px)))",
    );
  });

  it("reduces the column count when the viewer becomes narrow", () => {
    expect(getResponsiveMultiGridColumns(8, 1200)).toBe(4);
    expect(getResponsiveMultiGridColumns(8, 800)).toBe(3);
    expect(getResponsiveMultiGridColumns(4, 430)).toBe(1);
  });

  it("allocates the full available height between rows", () => {
    expect(getMultiGridCardHeight(1)).toBe(
      "min(100%, max(180px, calc(100% - 0px)))",
    );
    expect(getMultiGridCardHeight(2)).toBe(
      "min(100%, max(180px, calc(50% - 1px)))",
    );
  });
});
