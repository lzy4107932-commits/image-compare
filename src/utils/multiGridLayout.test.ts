import { describe, expect, it } from "vitest";
import {
  getMultiGridCardBasis,
  getPreferredMultiGridColumns,
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
});
