export function getDragAutoScrollAmount(
  pointerY: number,
  top: number,
  bottom: number,
) {
  const height = bottom - top;

  if (height <= 0) {
    return 0;
  }

  const edgeZone = Math.min(72, height / 4);
  const distanceFromTop = pointerY - top;
  const distanceFromBottom = bottom - pointerY;

  if (distanceFromTop < edgeZone) {
    return -Math.ceil(6 + 18 * (1 - distanceFromTop / edgeZone));
  }

  if (distanceFromBottom < edgeZone) {
    return Math.ceil(6 + 18 * (1 - distanceFromBottom / edgeZone));
  }

  return 0;
}
