import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_COUNT,
  MAX_IMAGE_FILE_BYTES,
  selectImportableImages,
} from "./imageImport";

const image = (size = 1024) => ({ type: "image/png", size });

describe("selectImportableImages", () => {
  it("accepts supported images within the configured limits", () => {
    const files = [image(), { type: "image/jpeg", size: 2048 }];
    const result = selectImportableImages(files, 0);

    expect(result.accepted).toEqual(files);
    expect(result).toMatchObject({
      rejectedType: 0,
      rejectedSize: 0,
      rejectedCount: 0,
    });
  });

  it("rejects unsupported and oversized files", () => {
    const result = selectImportableImages(
      [
        { type: "text/plain", size: 10 },
        image(MAX_IMAGE_FILE_BYTES + 1),
      ],
      0,
    );

    expect(result.accepted).toHaveLength(0);
    expect(result.rejectedType).toBe(1);
    expect(result.rejectedSize).toBe(1);
  });

  it("only fills the remaining image slots", () => {
    const result = selectImportableImages(
      [image(), image(), image()],
      MAX_IMAGE_COUNT - 1,
    );

    expect(result.accepted).toHaveLength(1);
    expect(result.rejectedCount).toBe(2);
  });
});
