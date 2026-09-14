import { describe, expect, it } from "vitest";
import type { LocalImage } from "../types";
import { hasSameDisplayImage, haveSameDisplayImages } from "./imageDisplay";

const image = (thumbnailUrl?: string): LocalImage => ({
  id: "one",
  name: "one.png",
  url: "blob:one",
  thumbnailUrl,
  size: 1024,
});

describe("display image equality", () => {
  it("ignores sidebar-only thumbnail updates", () => {
    expect(hasSameDisplayImage(image(), image("blob:thumbnail"))).toBe(true);
    expect(haveSameDisplayImages([image()], [image("blob:thumbnail")])).toBe(
      true,
    );
  });

  it("detects changes that affect the main image display", () => {
    expect(
      hasSameDisplayImage(image(), { ...image(), url: "blob:replacement" }),
    ).toBe(false);
    expect(haveSameDisplayImages([image()], [])).toBe(false);
  });
});
