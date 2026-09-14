import { describe, expect, it } from "vitest";
import type { LocalImage } from "../types";
import {
  getCompareAImage,
  getCompareBImage,
  getSelectedImage,
  imageLibraryReducer,
  INITIAL_IMAGE_LIBRARY_STATE,
} from "./imageLibraryState";

const image = (id: string): LocalImage => ({
  id,
  name: `${id}.png`,
  url: id,
  size: 1024,
});

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

  it("reorders images without changing selection or A/B roles", () => {
    const initial = imageLibraryReducer(INITIAL_IMAGE_LIBRARY_STATE, {
      type: "add",
      images: [image("one"), image("two"), image("three")],
    });
    const state = imageLibraryReducer(initial, {
      type: "reorder",
      imageId: "one",
      toIndex: 3,
    });

    expect(state.images.map(({ id }) => id)).toEqual(["two", "three", "one"]);
    expect(state.selectedId).toBe(initial.selectedId);
    expect(state.compareAId).toBe(initial.compareAId);
    expect(state.compareBId).toBe(initial.compareBId);
  });

  it("restores a complete previous image order", () => {
    const initial = imageLibraryReducer(INITIAL_IMAGE_LIBRARY_STATE, {
      type: "add",
      images: [image("one"), image("two"), image("three")],
    });
    const reordered = imageLibraryReducer(initial, {
      type: "reorder",
      imageId: "one",
      toIndex: 3,
    });
    const restored = imageLibraryReducer(reordered, {
      type: "restore-order",
      imageIds: ["one", "two", "three"],
    });

    expect(restored.images.map(({ id }) => id)).toEqual([
      "one",
      "two",
      "three",
    ]);
    expect(restored.selectedId).toBe(initial.selectedId);
    expect(restored.compareAId).toBe(initial.compareAId);
    expect(restored.compareBId).toBe(initial.compareBId);
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
    expect(
      imageLibraryReducer(initial, {
        type: "reorder",
        imageId: "missing",
        toIndex: 0,
      }),
    ).toBe(initial);
  });
});
