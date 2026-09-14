// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n";
import { MAX_IMAGE_FILE_BYTES } from "../utils/imageImport";
import { useImageLibrary } from "./useImageLibrary";

const createObjectURL = vi.fn<(file: Blob) => string>();
const revokeObjectURL = vi.fn<(url: string) => void>();

function Wrapper({ children }: PropsWithChildren) {
  return <I18nProvider>{children}</I18nProvider>;
}

describe("useImageLibrary object URL lifecycle", () => {
  beforeEach(() => {
    localStorage.setItem("image-viewer-language", "en");
    createObjectURL.mockReset();
    revokeObjectURL.mockReset();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("releases an object URL when its image is deleted", () => {
    createObjectURL.mockReturnValueOnce("blob:first");
    const { result } = renderHook(() => useImageLibrary(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.addImageFiles([
        new File(["image"], "first.png", { type: "image/png" }),
      ]);
    });

    const imageId = result.current.images[0].id;

    act(() => {
      result.current.deleteImage(imageId);
    });

    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:first");
  });

  it("isolates an image that cannot be decoded and reports the failure", () => {
    createObjectURL
      .mockReturnValueOnce("blob:broken")
      .mockReturnValueOnce("blob:healthy");
    const { result } = renderHook(() => useImageLibrary(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.addImageFiles([
        new File(["broken"], "broken.png", { type: "image/png" }),
        new File(["healthy"], "healthy.png", { type: "image/png" }),
      ]);
    });

    const brokenId = result.current.images[0].id;
    act(() => {
      result.current.handleImageLoadError(brokenId);
      result.current.handleImageLoadError(brokenId);
    });

    expect(result.current.images.map((image) => image.name)).toEqual([
      "healthy.png",
    ]);
    expect(result.current.importNotice).toBe(
      "The image could not be decoded and was removed",
    );
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:broken");
  });

  it("releases every remaining object URL when the library unmounts", () => {
    createObjectURL
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");
    const { result, unmount } = renderHook(() => useImageLibrary(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.addImageFiles([
        new File(["one"], "first.png", { type: "image/png" }),
        new File(["two"], "second.png", { type: "image/png" }),
      ]);
    });

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:second");
  });

  it("does not release cleared object URLs again during unmount", () => {
    createObjectURL.mockReturnValueOnce("blob:first");
    const { result, unmount } = renderHook(() => useImageLibrary(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.addImageFiles([
        new File(["image"], "first.png", { type: "image/png" }),
      ]);
      result.current.clearImages();
    });

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:first");
  });

  it("reports files rejected by the aggregate size limit", () => {
    createObjectURL.mockImplementation(
      () => `blob:image-${createObjectURL.mock.calls.length}`,
    );
    const { result } = renderHook(() => useImageLibrary(), {
      wrapper: Wrapper,
    });
    const files = Array.from({ length: 11 }, (_, index) => ({
      name: `image-${index}.png`,
      type: "image/png",
      size: MAX_IMAGE_FILE_BYTES,
    })) as File[];

    act(() => {
      result.current.addImageFiles(files);
    });

    expect(result.current.images).toHaveLength(10);
    expect(result.current.importNotice).toContain(
      "The total image size limit has been reached",
    );
  });

  it("releases a maximum-size batch when it is immediately cleared", () => {
    createObjectURL.mockImplementation(
      () => `blob:stress-${createObjectURL.mock.calls.length}`,
    );
    const { result } = renderHook(() => useImageLibrary(), {
      wrapper: Wrapper,
    });
    const files = Array.from(
      { length: 100 },
      (_, index) =>
        new File(["image"], `stress-${index}.png`, { type: "image/png" }),
    );

    act(() => {
      result.current.addImageFiles(files);
      result.current.clearImages();
    });

    expect(result.current.images).toHaveLength(0);
    expect(createObjectURL).toHaveBeenCalledTimes(100);
    expect(revokeObjectURL).toHaveBeenCalledTimes(100);
  });

  it("restores import order and allows that restoration to be undone", () => {
    createObjectURL
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second")
      .mockReturnValueOnce("blob:third");
    const { result } = renderHook(() => useImageLibrary(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.addImageFiles([
        new File(["one"], "first.png", { type: "image/png" }),
        new File(["two"], "second.png", { type: "image/png" }),
        new File(["three"], "third.png", { type: "image/png" }),
      ]);
    });

    const originalOrder = result.current.images.map(({ id }) => id);

    act(() => {
      result.current.reorderImage(originalOrder[0], 3);
    });

    const reordered = result.current.images.map(({ id }) => id);
    expect(result.current.canRestoreImportOrder).toBe(true);

    act(() => {
      result.current.restoreImportOrder();
    });

    expect(result.current.images.map(({ id }) => id)).toEqual(originalOrder);
    expect(result.current.canRestoreImportOrder).toBe(false);
    expect(result.current.canUndoReorder).toBe(true);

    act(() => {
      result.current.undoReorder();
    });

    expect(result.current.images.map(({ id }) => id)).toEqual(reordered);
    expect(result.current.canRestoreImportOrder).toBe(true);
  });
});
