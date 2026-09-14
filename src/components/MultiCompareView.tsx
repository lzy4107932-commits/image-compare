import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  EyeOff,
  Grid3X3,
  Maximize,
  Minus,
  Plus,
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
import {
  getMultiGridCardBasis,
  getMultiGridCardHeight,
  getPreferredMultiGridColumns,
  getResponsiveMultiGridColumns,
} from "../utils/multiGridLayout";

type DragState = {
  imageId: string;
  local: boolean;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type Props = {
  images: LocalImage[];
};

export default function MultiCompareView({ images }: Props) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [showFileNames, setShowFileNames] = useState(true);

  const dragRef = useRef<DragState | null>(null);

  const [globalTransform, setGlobalTransform] =
    useState<TransformState>(DEFAULT_TRANSFORM);

  const [localTransforms, setLocalTransforms] = useState<
    Record<string, TransformState>
  >({});

  const [dragging, setDragging] = useState<{
    imageId: string;
    local: boolean;
  } | null>(null);

  function getLocalTransform(imageId: string) {
    return localTransforms[imageId] ?? DEFAULT_TRANSFORM;
  }

  /*
   * 使用原生非被动 wheel 监听器：
   *
   * 普通滚轮：页面正常滚动；
   * Ctrl/Cmd + 滚轮：所有图片同步缩放；
   * Alt + 滚轮：只缩放当前图片。
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

      const imageArea = target.closest<HTMLElement>(
        ".multi-compare-image-area",
      );

      if (!imageArea || !root?.contains(imageArea)) {
        return;
      }

      const imageId = imageArea.dataset.imageId;

      if (!imageId) {
        return;
      }

      const isLocalZoom = event.altKey;
      const isGlobalZoom = event.ctrlKey || event.metaKey;

      /*
       * 没有按 Ctrl、Cmd 或 Alt 时，
       * 不拦截滚轮，让多图页面正常上下滚动。
       */
      if (!isLocalZoom && !isGlobalZoom) {
        return;
      }

      event.preventDefault();

      const zoomStep = event.deltaY < 0 ? 10 : -10;
      const areaRect = imageArea.getBoundingClientRect();

      const pointerX = event.clientX - (areaRect.left + areaRect.width / 2);

      const pointerY = event.clientY - (areaRect.top + areaRect.height / 2);

      if (isLocalZoom) {
        setLocalTransforms((currentTransforms) => {
          const current = currentTransforms[imageId] ?? DEFAULT_TRANSFORM;

          const nextZoom = clampZoom(current.zoom + zoomStep);

          if (nextZoom === current.zoom) {
            return currentTransforms;
          }

          return {
            ...currentTransforms,
            [imageId]: zoomAtPoint(current, nextZoom, pointerX, pointerY),
          };
        });

        return;
      }

      setGlobalTransform((current) => {
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
  }, []);

  function changeGlobalZoom(step: number) {
    setGlobalTransform((current) => ({
      ...current,
      zoom: clampZoom(current.zoom + step),
    }));
  }

  function resetAllTransforms() {
    setGlobalTransform(DEFAULT_TRANSFORM);
    setLocalTransforms({});
    setDragging(null);
    dragRef.current = null;
  }

  function rotateAllImages() {
    setGlobalTransform((current) => ({
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

        setGlobalTransform((current) => ({
          ...current,
          zoom: clampZoom(current.zoom + step),
        }));
        return;
      }

      if (action === "reset-view") {
        setGlobalTransform(DEFAULT_TRANSFORM);
        setLocalTransforms({});
        setDragging(null);
        dragRef.current = null;
        return;
      }

      setGlobalTransform((current) => ({
        ...current,
        rotation: (current.rotation + 90) % 360,
      }));
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    function updateWidth(width = root?.clientWidth ?? 0) {
      setContainerWidth(width);
    }

    function handleWindowResize() {
      updateWidth();
    }

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", handleWindowResize);

      return () => {
        window.removeEventListener("resize", handleWindowResize);
      };
    }

    const observer = new ResizeObserver((entries) => {
      updateWidth(entries[0]?.contentRect.width);
    });

    observer.observe(root);

    return () => observer.disconnect();
  }, []);

  function resetLocalTransform(imageId: string) {
    const globalScale = globalTransform.zoom / 100;

    /*
     * 当全局状态本身已经是默认值时，
     * 直接删除单图校准数据即可。
     */
    const isGlobalDefault =
      globalTransform.zoom === 100 &&
      globalTransform.x === 0 &&
      globalTransform.y === 0 &&
      globalTransform.rotation === 0;

    if (isGlobalDefault) {
      setLocalTransforms((currentTransforms) => {
        const nextTransforms = { ...currentTransforms };

        delete nextTransforms[imageId];

        return nextTransforms;
      });

      return;
    }

    /*
     * 当前图片最终状态的计算方式是：
     *
     * 最终缩放 = 全局缩放 × 单图缩放
     * 最终位置 = 全局位置 + 单图位置 × 全局缩放
     *
     * 因此这里设置反向补偿值，
     * 让当前图片在全局缩放、平移存在时，
     * 仍然单独恢复到 100% 和中心位置。
     */
    setLocalTransforms((currentTransforms) => ({
      ...currentTransforms,
      [imageId]: {
        zoom: 10000 / globalTransform.zoom,
        x: -globalTransform.x / globalScale,
        y: -globalTransform.y / globalScale,
        rotation: (360 - globalTransform.rotation) % 360,
      },
    }));
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    imageId: string,
  ) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    const local = event.altKey;

    const startTransform = local ? getLocalTransform(imageId) : globalTransform;

    dragRef.current = {
      imageId,
      local,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: startTransform.x,
      originY: startTransform.y,
    };

    setDragging({
      imageId,
      local,
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const moveX = event.clientX - drag.startX;
    const moveY = event.clientY - drag.startY;

    if (drag.local) {
      setLocalTransforms((currentTransforms) => {
        const current = currentTransforms[drag.imageId] ?? DEFAULT_TRANSFORM;

        return {
          ...currentTransforms,
          [drag.imageId]: {
            ...current,
            x: drag.originX + moveX,
            y: drag.originY + moveY,
          },
        };
      });

      return;
    }

    setGlobalTransform((current) => ({
      ...current,
      x: drag.originX + moveX,
      y: drag.originY + moveY,
    }));
  }

  function stopPointerDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setDragging(null);
  }

  function handleDoubleClick(
    event: React.MouseEvent<HTMLDivElement>,
    imageId: string,
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (event.altKey) {
      resetLocalTransform(imageId);
      return;
    }

    resetAllTransforms();
  }

  if (images.length < 3) {
    return (
      <div className="multi-compare-warning">
        <Grid3X3 size={46} />
        <h2>{t("multiCompareMinImages")}</h2>
        <p>{t("multiCompareUsageHint")}</p>
      </div>
    );
  }

  const toolbarCenterTarget =
    typeof document !== "undefined"
      ? document.getElementById("viewer-toolbar-center")
      : null;

  const preferredColumns = getPreferredMultiGridColumns(images.length);
  const columns = getResponsiveMultiGridColumns(
    images.length,
    containerWidth,
  );
  const rows = Math.max(1, Math.ceil(images.length / columns));
  const gridStyle = {
    "--multi-grid-card-basis": getMultiGridCardBasis(columns),
    "--multi-grid-card-height": getMultiGridCardHeight(rows),
  } as React.CSSProperties;

  return (
    <>
      {/* 中间区域：多图缩放和复位控件 */}
      {toolbarCenterTarget &&
        createPortal(
          <div className="multi-compare-toolbar-actions multi-toolbar-portal-controls">
            <button
              type="button"
              title={t("zoomOutAllImages")}
              aria-label={t("zoomOutAllImages")}
              onClick={() => changeGlobalZoom(-10)}
            >
              <Minus size={16} />
            </button>

            <button
              type="button"
              className="multi-zoom-value"
              title={`${t("resetAllTransforms")}: ${globalTransform.zoom}% · ${globalTransform.rotation}°`}
              aria-label={`${t("globalZoomLevel")}: ${globalTransform.zoom}%, ${t("rotationAngle")}: ${globalTransform.rotation}°`}
              aria-live="polite"
              aria-atomic="true"
              onClick={() => setGlobalTransform(DEFAULT_TRANSFORM)}
            >
              {globalTransform.zoom}% · {globalTransform.rotation}°
            </button>

            <button
              type="button"
              title={t("zoomInAllImages")}
              aria-label={t("zoomInAllImages")}
              onClick={() => changeGlobalZoom(10)}
            >
              <Plus size={16} />
            </button>

            <button
              type="button"
              className="multi-filename-toggle"
              title={
                showFileNames ? t("hideFileNames") : t("showFileNames")
              }
              aria-label={
                showFileNames ? t("hideFileNames") : t("showFileNames")
              }
              aria-pressed={showFileNames}
              onClick={() => setShowFileNames((current) => !current)}
            >
              {showFileNames ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{t("fileNames")}</span>
            </button>

            <button
              type="button"
              className="transform-action-button transform-rotate-button"
              title={`${t("rotateAllImages")} (R)`}
              aria-label={t("rotateAllImages")}
              onClick={rotateAllImages}
            >
              <RotateCw size={16} />
              <span>{t("rotate90")}</span>
            </button>
            <button
              type="button"
              className="transform-action-button transform-reset-button"
              title={t("resetAllTransforms")}
              aria-label={t("resetAllTransforms")}
              onClick={resetAllTransforms}
            >
              <Maximize size={16} />
              <span>{t("resetAll")}</span>
            </button>
          </div>,
          toolbarCenterTarget,
        )}

      <div className="multi-compare-shell" ref={rootRef}>
        <div
          className="grid-view multi-compare-view"
          data-layout-columns={columns}
          data-layout-rows={rows}
          data-preferred-columns={preferredColumns}
          style={gridStyle}
        >
          {images.map((image) => {
            const local = getLocalTransform(image.id);

            const finalTransform = composeTransforms(globalTransform, local);

            const hasLocalAdjustment =
              local.zoom !== 100 ||
              local.x !== 0 ||
              local.y !== 0 ||
              local.rotation !== 0;

            const isLocalDragging =
              dragging?.imageId === image.id && dragging.local;

            return (
              <div
                className={[
                  "grid-card",
                  "multi-compare-card",
                  hasLocalAdjustment || isLocalDragging
                    ? "is-local-adjusting"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={image.id}
              >
                <div
                  className="grid-image-area multi-compare-image-area"
                  data-image-id={image.id}
                  onPointerDown={(event) => handlePointerDown(event, image.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={stopPointerDrag}
                  onPointerCancel={stopPointerDrag}
                  onDoubleClick={(event) => handleDoubleClick(event, image.id)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    style={{
                      transform: `translate(${finalTransform.x}px, ${finalTransform.y}px) scale(${finalTransform.zoom}) rotate(${finalTransform.rotation}deg)`,
                    }}
                  />

                  <span
                    className={
                      hasLocalAdjustment
                        ? "multi-local-zoom"
                        : "multi-local-zoom is-default"
                    }
                  >
                    {t("singleImageZoom")} {local.zoom}%
                  </span>

                  {showFileNames && (
                    <div className="grid-card-name" title={image.name}>
                      {image.name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
