import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Grid3X3, Minus, Plus, RotateCcw } from "lucide-react";
import { useI18n } from "../i18n";

type MultiImage = {
  id: string;
  name: string;
  url: string;
};

type TransformState = {
  zoom: number;
  x: number;
  y: number;
};

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
  images: MultiImage[];
};

const DEFAULT_TRANSFORM: TransformState = {
  zoom: 100,
  x: 0,
  y: 0,
};

function clampZoom(value: number) {
  return Math.min(500, Math.max(10, value));
}

export default function MultiCompareView({ images }: Props) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);

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
   * 删除图片后，同时移除这张图片遗留的校准数据。
   */
  useEffect(() => {
    const currentImageIds = new Set(images.map((image) => image.id));

    setLocalTransforms((currentTransforms) => {
      const nextTransforms = Object.fromEntries(
        Object.entries(currentTransforms).filter(([imageId]) =>
          currentImageIds.has(imageId),
        ),
      );

      return nextTransforms;
    });
  }, [images]);

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

          const scaleRatio = nextZoom / current.zoom;

          return {
            ...currentTransforms,
            [imageId]: {
              zoom: nextZoom,
              x: pointerX - (pointerX - current.x) * scaleRatio,
              y: pointerY - (pointerY - current.y) * scaleRatio,
            },
          };
        });

        return;
      }

      setGlobalTransform((current) => {
        const nextZoom = clampZoom(current.zoom + zoomStep);

        if (nextZoom === current.zoom) {
          return current;
        }

        const scaleRatio = nextZoom / current.zoom;

        return {
          zoom: nextZoom,
          x: pointerX - (pointerX - current.x) * scaleRatio,
          y: pointerY - (pointerY - current.y) * scaleRatio,
        };
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

  function resetLocalTransform(imageId: string) {
    const globalScale = globalTransform.zoom / 100;

    /*
     * 当全局状态本身已经是默认值时，
     * 直接删除单图校准数据即可。
     */
    const isGlobalDefault =
      globalTransform.zoom === 100 &&
      globalTransform.x === 0 &&
      globalTransform.y === 0;

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
              title={t("globalZoomLevel")}
              aria-label={t("globalZoomLevel")}
              onClick={() => setGlobalTransform(DEFAULT_TRANSFORM)}
            >
              {globalTransform.zoom}%
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
              title={t("resetAllTransforms")}
              aria-label={t("resetAllTransforms")}
              onClick={resetAllTransforms}
            >
              <RotateCcw size={16} />
            </button>
          </div>,
          toolbarCenterTarget,
        )}

      <div className="multi-compare-shell" ref={rootRef}>
        <div className="grid-view multi-compare-view">
          {images.map((image) => {
            const local = getLocalTransform(image.id);

            const globalScale = globalTransform.zoom / 100;

            const finalScale = (globalTransform.zoom * local.zoom) / 10000;

            /*
             * 单图校准位置会在全局缩放时一起按比例变化。
             */
            const finalX = globalTransform.x + local.x * globalScale;

            const finalY = globalTransform.y + local.y * globalScale;

            const hasLocalAdjustment =
              local.zoom !== 100 || local.x !== 0 || local.y !== 0;

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
                    draggable={false}
                    style={{
                      transform: `translate(${finalX}px, ${finalY}px) scale(${finalScale})`,
                    }}
                  />

                  <span
                    className={
                      hasLocalAdjustment
                        ? "multi-local-zoom"
                        : "multi-local-zoom is-default"
                    }
                  >
                    单图 {local.zoom}%
                  </span>
                </div>

                <div className="grid-card-name" title={image.name}>
                  {image.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
