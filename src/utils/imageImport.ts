export const MAX_IMAGE_COUNT = 100;
export const MAX_IMAGE_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_FILE_MIB = MAX_IMAGE_FILE_BYTES / 1024 / 1024;

type ImageFileCandidate = {
  type: string;
  size: number;
};

export type ImageImportSelection<T> = {
  accepted: T[];
  rejectedType: number;
  rejectedSize: number;
  rejectedCount: number;
};

export function selectImportableImages<T extends ImageFileCandidate>(
  files: readonly T[],
  currentCount: number,
): ImageImportSelection<T> {
  const result: ImageImportSelection<T> = {
    accepted: [],
    rejectedType: 0,
    rejectedSize: 0,
    rejectedCount: 0,
  };

  const availableSlots = Math.max(0, MAX_IMAGE_COUNT - currentCount);

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

    result.accepted.push(file);
  }

  return result;
}
