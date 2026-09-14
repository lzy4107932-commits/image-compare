import type { LocalImage } from "../types";

export function hasSameDisplayImage(
  left: LocalImage | null,
  right: LocalImage | null,
) {
  if (left === right) {
    return true;
  }

  return (
    left?.id === right?.id &&
    left?.name === right?.name &&
    left?.url === right?.url &&
    left?.size === right?.size
  );
}

export function haveSameDisplayImages(
  left: readonly LocalImage[],
  right: readonly LocalImage[],
) {
  return (
    left === right ||
    (left.length === right.length &&
      left.every((image, index) => hasSameDisplayImage(image, right[index])))
  );
}
