export const MAX_IMAGE_COUNT = 100;
export const MAX_IMAGE_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_FILE_MIB = MAX_IMAGE_FILE_BYTES / 1024 / 1024;
export const MAX_TOTAL_IMAGE_BYTES = 500 * 1024 * 1024;
export const MAX_TOTAL_IMAGE_MIB = MAX_TOTAL_IMAGE_BYTES / 1024 / 1024;

type ImageFileCandidate = {
  type: string;
  size: number;
};

export type ImageImportSelection<T> = {
  accepted: T[];
  rejectedType: number;
  rejectedSize: number;
  rejectedTotalSize: number;
  rejectedCount: number;
};

export function selectImportableImages<T extends ImageFileCandidate>(
  files: readonly T[],
  currentCount: number,
  currentBytes = 0,
): ImageImportSelection<T> {
  const result: ImageImportSelection<T> = {
    accepted: [],
    rejectedType: 0,
    rejectedSize: 0,
    rejectedTotalSize: 0,
    rejectedCount: 0,
  };

  const availableSlots = Math.max(0, MAX_IMAGE_COUNT - currentCount);
  let acceptedBytes = 0;

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      result.rejectedType += 1;
      continue;
    }

    if (file.size > MAX_IMAGE_FILE_BYTES) {
      result.rejectedSize += 1;
      continue;
    }

    if (result.accepted.length >= availableSlots) {
      result.rejectedCount += 1;
      continue;
    }

    if (currentBytes + acceptedBytes + file.size > MAX_TOTAL_IMAGE_BYTES) {
      result.rejectedTotalSize += 1;
      continue;
    }

    result.accepted.push(file);
    acceptedBytes += file.size;
  }

  return result;
}
