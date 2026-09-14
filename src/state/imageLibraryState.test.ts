import { describe, expect, it } from "vitest";
import type { LocalImage } from "../types";
import {
  getCompareAImage,
  getCompareBImage,
  getSelectedImage,
  imageLibraryReducer,
  INITIAL_IMAGE_LIBRARY_STATE,
} from "./imageLibraryState";

const image = (id: string): LocalImage => ({ id, name: `${id}.png`, url: id });

describe("imageLibraryReducer", () => {
  it("initializes selection and A/B roles from an imported batch", () => {
    const state = imageLibraryReducer(INITIAL_IMAGE_LIBRARY_STATE, {
      type: "add",
      images: [image("one"), image("two"), image("three")],
    });

    expect(getSelectedImage(state)?.id).toBe("one");
    expect(getCompareAImage(state)?.id).toBe("one");
    expect(getCompareBImage(state)?.id).toBe("two");
  });

  it("swaps A and B when assigning the opposite image", () => {
    const initial = imageLibraryReducer(INITIAL_IMAGE_LIBRARY_STATE, {
      type: "add",
      images: [image("one"), image("two")],
    });
    const state = imageLibraryReducer(initial, {
      type: "set-a",
      imageId: "two",
    });

    expect(getCompareAImage(state)?.id).toBe("two");
    expect(getCompareBImage(state)?.id).toBe("one");
  });

  it("selects safe fallbacks after deleting an active image", () => {
    const initial = imageLibraryReducer(INITIAL_IMAGE_LIBRARY_STATE, {
      type: "add",
      images: [image("one"), image("two"), image("three")],
    });
    const state = imageLibraryReducer(initial, {
      type: "delete",
      imageId: "one",
    });

    expect(getSelectedImage(state)?.id).toBe("two");
    expect(getCompareAImage(state)?.id).toBe("two");
    expect(getCompareBImage(state)?.id).toBe("three");
  });

  it("keeps A and B distinct after deleting B", () => {
    const initial = imageLibraryReducer(INITIAL_IMAGE_LIBRARY_STATE, {
      type: "add",
      images: [image("one"), image("two"), image("three")],
    });
    const state = imageLibraryReducer(initial, {
      type: "delete",
      imageId: "two",
    });

    expect(getCompareAImage(state)?.id).toBe("one");
    expect(getCompareBImage(state)?.id).toBe("three");
  });

  it("swaps A and B when assigning A as the new B", () => {
    const initial = imageLibraryReducer(INITIAL_IMAGE_LIBRARY_STATE, {
      type: "add",
      images: [image("one"), image("two")],
    });
    const state = imageLibraryReducer(initial, {
      type: "set-b",
      imageId: "one",
    });

    expect(getCompareAImage(state)?.id).toBe("two");
    expect(getCompareBImage(state)?.id).toBe("one");
  });

  it("clears all images and roles", () => {
    const initial = imageLibraryReducer(INITIAL_IMAGE_LIBRARY_STATE, {
      type: "add",
      images: [image("one"), image("two")],
    });

    expect(imageLibraryReducer(initial, { type: "clear" })).toEqual(
      INITIAL_IMAGE_LIBRARY_STATE,
    );
  });

  it("ignores actions for unknown images", () => {
    const initial = imageLibraryReducer(INITIAL_IMAGE_LIBRARY_STATE, {
      type: "add",
      images: [image("one")],
    });

    expect(
      imageLibraryReducer(initial, { type: "select", imageId: "missing" }),
    ).toBe(initial);
    expect(
      imageLibraryReducer(initial, { type: "delete", imageId: "missing" }),
    ).toBe(initial);
    expect(
      imageLibraryReducer(initial, { type: "set-a", imageId: "missing" }),
    ).toBe(initial);
    expect(
      imageLibraryReducer(initial, { type: "set-b", imageId: "missing" }),
    ).toBe(initial);
  });
});
