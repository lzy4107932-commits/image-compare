export const MAX_THUMBNAIL_DIMENSION = 160;
export const THUMBNAIL_CONCURRENCY = 2;

type ImageObjectUrls = {
  url: string;
  thumbnailUrl?: string;
};

export function revokeImageObjectUrls(
  image: ImageObjectUrls,
  revoke: (url: string) => void = URL.revokeObjectURL.bind(URL),
) {
  if (image.thumbnailUrl && image.thumbnailUrl !== image.url) {
    revoke(image.thumbnailUrl);
  }

  revoke(image.url);
}

export function getContainedThumbnailSize(
  width: number,
  height: number,
  maxDimension = MAX_THUMBNAIL_DIMENSION,
) {
  if (width <= 0 || height <= 0 || maxDimension <= 0) {
    return null;
  }

  const scale = Math.min(1, maxDimension / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function createImageThumbnail(file: File): Promise<Blob | null> {
  if (typeof createImageBitmap !== "function") {
    return null;
  }

  const bitmap = await createImageBitmap(file);

  try {
    const size = getContainedThumbnailSize(bitmap.width, bitmap.height);

    if (!size) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return null;
    }

    context.drawImage(bitmap, 0, 0, size.width, size.height);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.82);
    });
  } finally {
    bitmap.close();
  }
}

type AsyncTask = () => Promise<void>;

export class AsyncTaskQueue {
  private activeTasks = 0;
  private readonly pendingTasks: AsyncTask[] = [];
  private readonly concurrency: number;

  constructor(concurrency: number) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new Error("Concurrency must be a positive integer");
    }

    this.concurrency = concurrency;
  }

  enqueue(task: AsyncTask) {
    this.pendingTasks.push(task);
    this.startPendingTasks();
  }

  clear() {
    this.pendingTasks.length = 0;
  }

  private startPendingTasks() {
    while (
      this.activeTasks < this.concurrency &&
      this.pendingTasks.length > 0
    ) {
      const task = this.pendingTasks.shift();

      if (!task) {
        return;
      }

      this.activeTasks += 1;
      void task()
        .catch(() => undefined)
        .finally(() => {
          this.activeTasks -= 1;
          this.startPendingTasks();
        });
    }
  }
}
