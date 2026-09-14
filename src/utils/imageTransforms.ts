export type TransformState = {
  zoom: number;
  x: number;
  y: number;
  rotation: number;
};

export const DEFAULT_TRANSFORM: TransformState = {
  zoom: 100,
  x: 0,
  y: 0,
  rotation: 0,
};

export function clampZoom(value: number) {
  return Math.min(500, Math.max(10, value));
}

export function zoomAtPoint(
  current: TransformState,
  nextZoom: number,
  pointerX: number,
  pointerY: number,
): TransformState {
  if (nextZoom === current.zoom) {
    return current;
  }

  const scaleRatio = nextZoom / current.zoom;

  return {
    zoom: nextZoom,
    x: pointerX - (pointerX - current.x) * scaleRatio,
    y: pointerY - (pointerY - current.y) * scaleRatio,
    rotation: current.rotation,
  };
}

export function composeTransforms(
  globalTransform: TransformState,
  localTransform: TransformState,
): TransformState {
  const globalScale = globalTransform.zoom / 100;

  return {
    zoom: (globalTransform.zoom * localTransform.zoom) / 10000,
    x: globalTransform.x + localTransform.x * globalScale,
    y: globalTransform.y + localTransform.y * globalScale,
    rotation: (globalTransform.rotation + localTransform.rotation) % 360,
  };
}
