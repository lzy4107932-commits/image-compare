import type { ViewMode } from "../types";

export type ViewerKeyboardAction =
  | "stop-panning"
  | "zoom-in"
  | "zoom-out"
  | "reset-view"
  | "rotate-clockwise"
  | "select-previous"
  | "select-next";

export type TransformKeyboardAction = Extract<
  ViewerKeyboardAction,
  "zoom-in" | "zoom-out" | "reset-view" | "rotate-clockwise"
>;

type ViewerKeyboardContext = {
  key: string;
  viewMode: ViewMode;
  imageCount: number;
};

export function isTextEditingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function getViewerKeyboardAction({
  key,
  viewMode,
  imageCount,
}: ViewerKeyboardContext): ViewerKeyboardAction | null {
  if (key === "Escape") {
    return "stop-panning";
  }

  if (viewMode !== "single") {
    return null;
  }

  const transformAction = getTransformKeyboardAction(key);

  if (transformAction) {
    return transformAction;
  }

  if (imageCount === 0) {
    return null;
  }

  if (key === "ArrowLeft") {
    return "select-previous";
  }

  if (key === "ArrowRight") {
    return "select-next";
  }

  return null;
}

export function getTransformKeyboardAction(
  key: string,
): TransformKeyboardAction | null {
  if (key === "+" || key === "=") {
    return "zoom-in";
  }

  if (key === "-") {
    return "zoom-out";
  }

  if (key === "0" || key === "Home") {
    return "reset-view";
  }

  if (key.toLowerCase() === "r") {
    return "rotate-clockwise";
  }

  return null;
}
