// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AsyncTaskQueue,
  createImageThumbnail,
  getContainedThumbnailSize,
  revokeImageObjectUrls,
} from "./imageThumbnail";

describe("image thumbnails", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps aspect ratio and never enlarges small images", () => {
    expect(getContainedThumbnailSize(4000, 2000)).toEqual({
      width: 160,
      height: 80,
    });
    expect(getContainedThumbnailSize(80, 40)).toEqual({
      width: 80,
      height: 40,
    });
    expect(getContainedThumbnailSize(0, 40)).toBeNull();
  });

  it("releases both thumbnail and original object URLs without duplicates", () => {
    const revoke = vi.fn();

    revokeImageObjectUrls(
      { url: "blob:original", thumbnailUrl: "blob:thumbnail" },
      revoke,
    );
    revokeImageObjectUrls(
      { url: "blob:shared", thumbnailUrl: "blob:shared" },
      revoke,
    );

    expect(revoke.mock.calls).toEqual([
      ["blob:thumbnail"],
      ["blob:original"],
      ["blob:shared"],
    ]);
  });

  it("creates a bounded WebP thumbnail and closes the decoded bitmap", async () => {
    const close = vi.fn();
    const drawImage = vi.fn();
    const thumbnail = new Blob(["thumbnail"], { type: "image/webp" });
    const bitmap = { width: 4000, height: 2000, close } as ImageBitmap;

    vi.stubGlobal("createImageBitmap", vi.fn(async () => bitmap));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => callback(thumbnail),
    );

    const result = await createImageThumbnail(
      new File(["image"], "large.png", { type: "image/png" }),
    );

    expect(result).toBe(thumbnail);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 160, 80);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("limits concurrent thumbnail work", async () => {
    const queue = new AsyncTaskQueue(2);
    const resolvers: Array<() => void> = [];
    let active = 0;
    let peakActive = 0;
    const completed = vi.fn();

    for (let index = 0; index < 4; index += 1) {
      queue.enqueue(
        () =>
          new Promise<void>((resolve) => {
            active += 1;
            peakActive = Math.max(peakActive, active);
            resolvers.push(() => {
              active -= 1;
              completed(index);
              resolve();
            });
          }),
      );
    }

    expect(active).toBe(2);
    resolvers.shift()?.();
    await vi.waitFor(() => expect(resolvers).toHaveLength(2));
    expect(peakActive).toBe(2);

    while (completed.mock.calls.length < 4) {
      resolvers.shift()?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    expect(completed).toHaveBeenCalledTimes(4);
    expect(peakActive).toBe(2);
  });

  it("drops work that has not started when cleared", async () => {
    const queue = new AsyncTaskQueue(1);
    let finishFirst: (() => void) | undefined;
    const secondTask = vi.fn(async () => undefined);

    queue.enqueue(
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve;
        }),
    );
    queue.enqueue(secondTask);
    queue.clear();
    finishFirst?.();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(secondTask).not.toHaveBeenCalled();
  });
});
