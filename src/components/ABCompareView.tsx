import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import {
  Columns2,
  Layers3,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { useI18n } from "../useI18n";
import type { LocalImage } from "../types";
import {
  clampZoom,
  composeTransforms,
  DEFAULT_TRANSFORM,
  type TransformState,
  zoomAtPoint,
} from "../utils/imageTransforms";
import {
  getTransformKeyboardAction,
  isTextEditingTarget,
} from "../utils/viewerKeyboard";

type CompareMode = "side" | "overlay";
type OperationMode = "sync" | "a" | "b";

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  operationMode: OperationMode;
};

type DividerDragState = {
  pointerId: number;
  stage: HTMLElement;
};

type ImageTransformState = {
  imageId: string | null;
  transform: TransformState;
};

type Props = {
  imageA: LocalImage | null;
  imageB: LocalImage | null;
  onHelpChange?: (help: string) => void;
};

export default function ABCompareView({ imageA, imageB, onHelpChange }: Props) {
  const { t } = useI18n();

  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const dividerDragRef = useRef<DividerDragState | null>(null);

  const [compareMode, setCompareMode] = useState<CompareMode>("side");

  const [operationMode, setOperationMode] = useState<OperationMode>("sync");

  const [comparePosition, setComparePosition] = useState(50);

  /*
   * globalTransform：同步变换。
   * transformA、transformB：A、B 各自的校准变换。
   */
  const [globalTransform, setGlobalTransform] =
    useState<TransformState>(DEFAULT_TRANSFORM);

  const [transformAState, setTransformAState] = useState<ImageTransformState>(
    () => ({
      imageId: imageA?.id ?? null,
      transform: DEFAULT_TRANSFORM,
    }),
  );

  const [transformBState, setTransformBState] = useState<ImageTransformState>(
    () => ({
      imageId: imageB?.id ?? null,
      transform: DEFAULT_TRANSFORM,
    }),
  );

  const transformA =
    transformAState.imageId === (imageA?.id ?? null)
      ? transformAState.transform
      : DEFAULT_TRANSFORM;

  const transformB =
    transformBState.imageId === (imageB?.id ?? null)
      ? transformBState.transform
      : DEFAULT_TRANSFORM;

  const setTransformA = useCallback(
    (action: SetStateAction<TransformState>) => {
      const imageId = imageA?.id ?? null;

      setTransformAState((currentState) => {
        const currentTransform =
          currentState.imageId === imageId
            ? currentState.transform
            : DEFAULT_TRANSFORM;

        return {
          imageId,
          transform:
            typeof action === "function" ? action(currentTransform) : action,
        };
      });
    },
    [imageA?.id],
  );

  const setTransformB = useCallback(
    (action: SetStateAction<TransformState>) => {
      const imageId = imageB?.id ?? null;

      setTransformBState((currentState) => {
        const currentTransform =
          currentState.imageId === imageId
            ? currentState.transform
            : DEFAULT_TRANSFORM;

        return {
          imageId,
          transform:
            typeof action === "function" ? action(currentTransform) : action,
        };
      });
    },
    [imageB?.id],
  );

  const [isPanning, setIsPanning] = useState(false);
  useEffect(() => {
    const operationDescription =
      operationMode === "sync"
        ? t("syncBothImages")
        : operationMode === "a"
          ? t("adjustOnlyA")
          : t("adjustOnlyB");

    const help = [
      `${t("current")}: ${operationDescription}`,
      t("wheelZoom"),
      t("dragToPan"),
      t("switchBackToSync"),
      t("compareKeyboardHelp"),
    ].join(" | ");

    onHelpChange?.(help);
  }, [operationMode, onHelpChange, t]);

  function getOperationTransform() {
    if (operationMode === "a") {
      return transformA;
    }

    if (operationMode === "b") {
      return transformB;
    }

    return globalTransform;
  }

  const updateOperationTransform = useCallback(
    (updater: (current: TransformState) => TransformState) => {
      if (operationMode === "a") {
        setTransformA(updater);
        return;
      }

      if (operationMode === "b") {
        setTransformB(updater);
        return;
      }

      setGlobalTransform(updater);
    },
    [operationMode, setTransformA, setTransformB],
  );

  /*
   * 当前图片的最终显示状态：
   *
   * 最终缩放 = 同步缩放 × 单图校准缩放
   * 最终位置 = 同步位置 + 单图校准位置 × 同步缩放
   */
  function getFinalTransform(localTransform: TransformState) {
    return composeTransforms(globalTransform, localTransform);
  }

  const finalTransformA = getFinalTransform(transformA);

  const finalTransformB = getFinalTransform(transformB);

  /*
   * 非被动滚轮监听器。
   * 根据“同步 / 调整 A / 调整 B”决定缩放哪一层。
   */
  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    function handleWheel(event: globalThis.WheelEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const viewport = target.closest<HTMLElement>(".ab-independent-viewport");

      if (!viewport || !root?.contains(viewport)) {
        return;
      }

      event.preventDefault();

      const zoomStep = event.deltaY < 0 ? 10 : -10;

      const viewportRect = viewport.getBoundingClientRect();

      const pointerX =
        event.clientX - (viewportRect.left + viewportRect.width / 2);

      const pointerY =
        event.clientY - (viewportRect.top + viewportRect.height / 2);

      updateOperationTransform((current) => {
        const nextZoom = clampZoom(current.zoom + zoomStep);

        if (nextZoom === current.zoom) {
          return current;
        }

        return zoomAtPoint(current, nextZoom, pointerX, pointerY);
      });
    }

    root.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      root.removeEventListener("wheel", handleWheel);
    };
  }, [updateOperationTransform]);

  function changeCurrentZoom(step: number) {
    updateOperationTransform((current) => ({
      ...current,
      zoom: clampZoom(current.zoom + step),
    }));
  }

  function resetCurrentTransform() {
    if (operationMode === "a") {
      setTransformA(DEFAULT_TRANSFORM);
      return;
    }

    if (operationMode === "b") {
      setTransformB(DEFAULT_TRANSFORM);
      return;
    }

    setGlobalTransform(DEFAULT_TRANSFORM);
  }

  function resetAllTransforms() {
    setGlobalTransform(DEFAULT_TRANSFORM);
    setTransformA(DEFAULT_TRANSFORM);
    setTransformB(DEFAULT_TRANSFORM);
    setComparePosition(50);
    setIsPanning(false);

    dragRef.current = null;
    dividerDragRef.current = null;
  }

  function rotateCurrentTransform() {
    updateOperationTransform((current) => ({
      ...current,
      rotation: (current.rotation + 90) % 360,
    }));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTextEditingTarget(event.target)) {
        return;
      }

      const action = getTransformKeyboardAction(event.key);

      if (!action) {
        return;
      }

      event.preventDefault();

      if (action === "zoom-in" || action === "zoom-out") {
        const step = action === "zoom-in" ? 10 : -10;

        updateOperationTransform((current) => ({
          ...current,
          zoom: clampZoom(current.zoom + step),
        }));
        return;
      }

      if (action === "reset-view") {
        updateOperationTransform(() => DEFAULT_TRANSFORM);
        return;
      }

      updateOperationTransform((current) => ({
        ...current,
        rotation: (current.rotation + 90) % 360,
      }));
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [updateOperationTransform]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const current = getOperationTransform();

    event.preventDefault();
    event.stopPropagation();

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
      operationMode,
    };

    setIsPanning(true);

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const moveX = event.clientX - drag.startX;

    const moveY = event.clientY - drag.startY;

    const nextPosition = (current: TransformState): TransformState => ({
      ...current,
      x: drag.originX + moveX,
      y: drag.originY + moveY,
    });

    if (drag.operationMode === "a") {
      setTransformA(nextPosition);
      return;
    }

    if (drag.operationMode === "b") {
      setTransformB(nextPosition);
      return;
    }

    setGlobalTransform(nextPosition);
  }

  function stopPointerDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setIsPanning(false);
  }

  function updateDividerPosition(clientX: number, stage: HTMLElement) {
    const stageRect = stage.getBoundingClientRect();

    const nextPosition = ((clientX - stageRect.left) / stageRect.width) * 100;

    setComparePosition(Math.min(100, Math.max(0, nextPosition)));
  }

  function handleDividerPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const stage = event.currentTarget.closest(".ab-overlay-stage");

    if (!(stage instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    dividerDragRef.current = {
      pointerId: event.pointerId,
      stage,
    };

    event.currentTarget.setPointerCapture(event.pointerId);

    updateDividerPosition(event.clientX, stage);
  }

  function handleDividerPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const dividerDrag = dividerDragRef.current;

    if (!dividerDrag || dividerDrag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    updateDividerPosition(event.clientX, dividerDrag.stage);
  }

  function stopDividerDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dividerDragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dividerDragRef.current = null;
  }

  if (!imageA || !imageB) {
    return (
      <div className="compare-warning">
        <Columns2 size={46} />

        <h2>{t("needTwoImages")}</h2>

        <p>{t("needTwoImagesDescription")}</p>
      </div>
    );
  }

  const operationZoom = getOperationTransform().zoom;

  const transformStyleA = {
    transform: `translate(${finalTransformA.x}px, ${finalTransformA.y}px) scale(${finalTransformA.zoom}) rotate(${finalTransformA.rotation}deg)`,
  };

  const transformStyleB = {
    transform: `translate(${finalTransformB.x}px, ${finalTransformB.y}px) scale(${finalTransformB.zoom}) rotate(${finalTransformB.rotation}deg)`,
  };
  const toolbarCenterTarget =
    typeof document !== "undefined"
      ? document.getElementById("viewer-toolbar-center")
      : null;

  const toolbarActionsTarget =
    typeof document !== "undefined"
      ? document.getElementById("viewer-toolbar-actions")
      : null;

  return (
    <>
      {/* 顶部中间：对比方式和操作对象 */}
      {toolbarCenterTarget &&
        createPortal(
          <div className="ab-toolbar-portal ab-toolbar-portal-center">
            <div className="ab-display-modes">
              <button
                type="button"
                className={compareMode === "side" ? "active" : ""}
                onClick={() => setCompareMode("side")}
              >
                <Columns2 size={16} />
                {t("sideBySide")}
              </button>
              <button
                type="button"
                className={compareMode === "overlay" ? "active" : ""}
                onClick={() => setCompareMode("overlay")}
              >
                <Layers3 size={15} />
                {t("overlayCompare")}
              </button>
            </div>
            <div className="ab-toolbar-separator" />
            <div className="ab-operation-modes">
              <span>{t("operationTarget")}:</span>
              <button
                type="button"
                className={operationMode === "sync" ? "active sync" : ""}
                onClick={() => setOperationMode("sync")}
              >
                {t("sync")}
              </button>
              <button
                type="button"
                className={operationMode === "a" ? "active image-a" : ""}
                onClick={() => setOperationMode("a")}
              >
                {t("adjustA")}
              </button>
              <button
                type="button"
                className={operationMode === "b" ? "active image-b" : ""}
                onClick={() => setOperationMode("b")}
              >
                {t("adjustB")}
              </button>
            </div>
          </div>,
          toolbarCenterTarget,
        )}
      {/* 顶部右侧：缩放和复位 */}
      {toolbarActionsTarget &&
        createPortal(
          <div className="ab-toolbar-portal ab-transform-controls">
            <button
              type="button"
              title={t("zoomOutCurrent")}
              aria-label={t("zoomOutCurrent")}
              onClick={() => changeCurrentZoom(-10)}
            >
              <Minus size={15} />
            </button>
            <button
              type="button"
              className="ab-zoom-value"
              title={t("currentZoom")}
              aria-label={t("currentZoom")}
              onClick={resetCurrentTransform}
            >
              {operationZoom}%
            </button>
            <button
              type="button"
              title={t("zoomInCurrent")}
              aria-label={t("zoomInCurrent")}
              onClick={() => changeCurrentZoom(10)}
            >
              <Plus size={15} />
            </button>
            <button
              type="button"
              title={t("resetCurrentTitle")}
              onClick={resetCurrentTransform}
            >
              {t("resetCurrent")}
            </button>
            <button
              type="button"
              title={`${t("rotateCurrentTarget")} (R)`}
              aria-label={t("rotateCurrentTarget")}
              onClick={rotateCurrentTransform}
            >
              <RotateCw size={15} />
            </button>
            <button
              type="button"
              title={t("resetAllTitle")}
              onClick={resetAllTransforms}
            >
              <RotateCcw size={15} />
              {t("resetAll")}
            </button>
          </div>,
          toolbarActionsTarget,
        )}
      {/* 原来的 A/B 根节点继续保留 */}
      <div
        ref={rootRef}
        className={["ab-independent-view", isPanning ? "is-ab-panning" : ""]
          .filter(Boolean)
          .join(" ")}
        onWheel={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        {compareMode === "side" ? (
          <div className="ab-side-view">
            <div className="ab-side-panel">
              <div className="compare-label">A</div>

              <div
                className="ab-independent-viewport"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopPointerDrag}
                onPointerCancel={stopPointerDrag}
              >
                <img
                  src={imageA.url}
                  alt={imageA.name}
                  draggable={false}
                  style={transformStyleA}
                />
              </div>

              <div className="compare-name">{imageA.name}</div>
            </div>

            <div className="compare-divider" />

            <div className="ab-side-panel">
              <div className="compare-label ab-label-b">B</div>

              <div
                className="ab-independent-viewport"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopPointerDrag}
                onPointerCancel={stopPointerDrag}
              >
                <img
                  src={imageB.url}
                  alt={imageB.name}
                  draggable={false}
                  style={transformStyleB}
                />
              </div>

              <div className="compare-name">{imageB.name}</div>
            </div>
          </div>
        ) : (
          <div className="ab-overlay-view">
            <div
              className="ab-overlay-stage ab-independent-viewport"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopPointerDrag}
              onPointerCancel={stopPointerDrag}
            >
              <img
                className="ab-overlay-image"
                src={imageA.url}
                alt={imageA.name}
                draggable={false}
                style={transformStyleA}
              />

              <div
                className="ab-overlay-b-layer"
                style={{
                  clipPath: `inset(0 ${100 - comparePosition}% 0 0)`,
                }}
              >
                <img
                  className="ab-overlay-image"
                  src={imageB.url}
                  alt={imageB.name}
                  draggable={false}
                  style={transformStyleB}
                />
              </div>

              <div
                className="ab-overlay-divider-control"
                style={{
                  left: `${comparePosition}%`,
                }}
                onPointerDown={handleDividerPointerDown}
                onPointerMove={handleDividerPointerMove}
                onPointerUp={stopDividerDrag}
                onPointerCancel={stopDividerDrag}
              >
                <div className="ab-overlay-divider-line" />

                <div className="ab-overlay-divider-handle">↔</div>
              </div>

              <div className="overlay-label overlay-label-a">A</div>

              <div className="overlay-label overlay-label-b">B</div>
            </div>

            <div className="overlay-names">
              <span>A：{imageA.name}</span>

              <span>
                {t("splitPosition")}: {Math.round(comparePosition)}%
              </span>

              <span>B：{imageB.name}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
