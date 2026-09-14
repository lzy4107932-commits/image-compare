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
});
