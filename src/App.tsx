import { useEffect, useMemo, useRef, useState } from "react";
import logoImage from "./assets/logo.png";
import type {
  ChangeEvent,
  DragEvent,
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import LanguageSwitch from "./components/LanguageSwitch";
import ThemeSwitcher from "./components/ThemeSwitcher";
import { useI18n } from "./i18n";
import {
  Columns2,
  Grid2X2,
  Grid3X3,
  Image as ImageIcon,
  Images,
  Maximize,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "./App.css";
type Theme = "dark" | "gray" | "light";
import MultiCompareView from "./components/MultiCompareView";
import ABCompareView from "./components/ABCompareView";

type ViewMode = "single" | "compare" | "grid";

type LocalImage = {
  id: string;
  name: string;
  url: string;
};

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("image-compare-theme");

    if (
      savedTheme === "dark" ||
      savedTheme === "gray" ||
      savedTheme === "light"
    ) {
      return savedTheme;
    }

    return "dark";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("image-compare-theme", theme);
  }, [theme]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<LocalImage[]>([]);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareAId, setCompareAId] = useState<string | null>(null);
  const [compareBId, setCompareBId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const { t } = useI18n();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [compareHelp, setCompareHelp] = useState("");

  /*
   * A/BCompareView 内部保存着“同步 / 调整 A / 调整 B”状态，
   * 因此由子组件把当前操作提示传给底部状态栏。
   */
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const preventCanvasWheelDefault = (event: globalThis.WheelEvent) => {
      if (viewMode !== "grid") {
        event.preventDefault();
      }
    };

    canvas.addEventListener("wheel", preventCanvasWheelDefault, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("wheel", preventCanvasWheelDefault);
    };
  }, [viewMode]);

  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [pan, setPan] = useState({
    x: 0,
    y: 0,
  });

  const [isPanning, setIsPanning] = useState(false);

  const panStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    panX: 0,
    panY: 0,
  });
  /*
   * 始终保存最新的图片列表。
   * 这样组件卸载时可以释放当前仍然存在的对象 URL。
   */
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  /*
   * 页面关闭、刷新或 App 组件卸载时，
   * 释放所有尚未释放的本地图片对象 URL。
   */
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });

      imagesRef.current = [];
    };
  }, []);

  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      const isEditingText =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (isEditingText) {
        return;
      }

      /*
       * Esc：立即结束图片平移状态。
       */
      if (event.key === "Escape") {
        setIsPanning(false);
        return;
      }

      /*
       * 多图网格模式保留正常滚动，
       * 不处理图片缩放快捷键。
       */
      if (viewMode !== "grid") {
        /*
         * + 或 =：放大 10%。
         */
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();

          setZoom((currentZoom) => Math.min(currentZoom + 10, 500));

          return;
        }

        /*
         * -：缩小 10%。
         */
        if (event.key === "-") {
          event.preventDefault();

          setZoom((currentZoom) => Math.max(currentZoom - 10, 10));

          return;
        }

        /*
         * 0 或 Home：
         * 恢复 100% 并把图片移动回中心。
         */
        if (event.key === "0" || event.key === "Home") {
          event.preventDefault();

          setZoom(100);
          setPan({
            x: 0,
            y: 0,
          });
          setIsPanning(false);

          return;
        }
      }

      /*
       * 左右方向键只在单图模式中切换图片。
       */
      if (viewMode !== "single" || images.length === 0) {
        return;
      }

      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();

      const currentIndex = images.findIndex((image) => image.id === selectedId);

      if (event.key === "ArrowLeft") {
        const previousIndex =
          currentIndex <= 0 ? images.length - 1 : currentIndex - 1;

        setSelectedId(images[previousIndex].id);
        return;
      }

      const nextIndex =
        currentIndex < 0 || currentIndex >= images.length - 1
          ? 0
          : currentIndex + 1;

      setSelectedId(images[nextIndex].id);
    }

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [images, selectedId, viewMode]);

  const selectedImage = useMemo(() => {
    return images.find((image) => image.id === selectedId) ?? images[0] ?? null;
  }, [images, selectedId]);

  const compareAImage = useMemo(() => {
    return images.find((image) => image.id === compareAId) ?? images[0] ?? null;
  }, [images, compareAId]);

  const compareBImage = useMemo(() => {
    const savedImage = images.find(
      (image) => image.id === compareBId && image.id !== compareAImage?.id,
    );

    if (savedImage) {
      return savedImage;
    }

    return images.find((image) => image.id !== compareAImage?.id) ?? null;
  }, [images, compareAId, compareBId, compareAImage]);

  function addImageFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      return;
    }

    const currentTime = Date.now();

    const newImages: LocalImage[] = imageFiles.map((file, index) => ({
      id: `${currentTime}-${index}-${file.name}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImages((currentImages) => {
      const nextImages = [...currentImages, ...newImages];

      imagesRef.current = nextImages;

      return nextImages;
    });

    if (!selectedId && newImages[0]) {
      setSelectedId(newImages[0].id);
    }

    if (!compareAId && newImages[0]) {
      setCompareAId(newImages[0].id);
    }

    if (!compareBId && newImages[1]) {
      setCompareBId(newImages[1].id);
    }
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addImageFiles(event.target.files);
    }

    event.target.value = "";
  }
  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFiles(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setIsDraggingFiles(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    const nextElement = event.relatedTarget as Node | null;

    if (!nextElement || !event.currentTarget.contains(nextElement)) {
      setIsDraggingFiles(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFiles(false);

    if (event.dataTransfer.files.length > 0) {
      addImageFiles(event.dataTransfer.files);
    }
  }

  function setAsImageA(imageId: string) {
    if (imageId === compareBImage?.id) {
      setCompareBId(compareAImage?.id ?? null);
    }

    setCompareAId(imageId);
  }

  function setAsImageB(imageId: string) {
    if (imageId === compareAImage?.id) {
      setCompareAId(compareBImage?.id ?? null);
    }

    setCompareBId(imageId);
  }

  function handleDelete(imageId: string) {
    const target = images.find((image) => image.id === imageId);

    if (target) {
      URL.revokeObjectURL(target.url);
    }

    const nextImages = images.filter((image) => image.id !== imageId);

    imagesRef.current = nextImages;
    setImages(nextImages);

    if (selectedImage?.id === imageId) {
      setSelectedId(nextImages[0]?.id ?? null);
    }

    if (compareAImage?.id === imageId) {
      const nextA = nextImages[0] ?? null;
      setCompareAId(nextA?.id ?? null);
    }

    if (compareBImage?.id === imageId) {
      const nextB =
        nextImages.find((image) => image.id !== compareAImage?.id) ??
        nextImages[1] ??
        null;

      setCompareBId(nextB?.id ?? null);
    }
  }

  function handleClear() {
    images.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });

    imagesRef.current = [];

    setImages([]);
    setSelectedId(null);
    setCompareAId(null);
    setCompareBId(null);
    setZoom(100);
    setRotation(0);
    setPan({
      x: 0,
      y: 0,
    });
    setIsPanning(false);
  }

  function zoomIn() {
    setZoom((currentZoom) => Math.min(currentZoom + 10, 500));
  }

  function zoomOut() {
    setZoom((currentZoom) => Math.max(currentZoom - 10, 10));
  }

  function resetZoom() {
    setZoom(100);
    setPan({
      x: 0,
      y: 0,
    });
  }

  function handleCanvasWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (viewMode === "grid") {
      return;
    }

    const zoomStep = event.deltaY < 0 ? 10 : -10;
    const nextZoom = Math.min(Math.max(zoom + zoomStep, 10), 500);

    if (nextZoom === zoom) {
      return;
    }

    const target = event.target;

    const zoomViewport =
      target instanceof Element
        ? target.closest(".single-view, .compare-image-area, .overlay-stage")
        : null;

    const viewportRect = (
      zoomViewport instanceof HTMLElement ? zoomViewport : event.currentTarget
    ).getBoundingClientRect();

    const pointerX =
      event.clientX - (viewportRect.left + viewportRect.width / 2);

    const pointerY =
      event.clientY - (viewportRect.top + viewportRect.height / 2);

    const scaleRatio = nextZoom / zoom;

    setPan((currentPan) => ({
      x: pointerX - (pointerX - currentPan.x) * scaleRatio,
      y: pointerY - (pointerY - currentPan.y) * scaleRatio,
    }));

    setZoom(nextZoom);
  }

  function handleCanvasMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (viewMode === "grid") {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;

    const isOverlayRange = target.classList.contains("overlay-range");

    /*
     * 重叠对比模式下：
     * 普通左键负责拖动分割线；
     * Shift + 左键负责平移图片。
     */
    if (isOverlayRange && !event.shiftKey) {
      return;
    }

    if (isOverlayRange && event.shiftKey) {
      event.preventDefault();
    }

    panStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };

    setIsPanning(true);
  }

  function handleCanvasMouseMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!isPanning) {
      return;
    }

    event.preventDefault();

    const moveX = event.clientX - panStartRef.current.mouseX;

    const moveY = event.clientY - panStartRef.current.mouseY;

    setPan({
      x: panStartRef.current.panX + moveX,
      y: panStartRef.current.panY + moveY,
    });
  }

  function handleCanvasMouseUp() {
    setIsPanning(false);
  }
  function handleCanvasDoubleClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (viewMode === "grid") {
      return;
    }

    const target = event.target as HTMLElement;

    /*
     * 双击重叠对比的分割线时不执行复位，
     * 避免影响分割线自身的操作。
     */
    if (target.classList.contains("overlay-range")) {
      return;
    }

    setZoom(100);
    setPan({
      x: 0,
      y: 0,
    });
    setRotation(0);
    setIsPanning(false);
  }
  function handleRotateClockwise() {
    if (viewMode !== "single") {
      return;
    }

    setRotation((currentRotation) => (currentRotation + 90) % 360);
  }
  /*
   * 三种查看模式分别使用自己的底部快捷键提示。
   */
  const singleStatusHelp = [
    t("wheelZoom"),
    t("dragToPan"),
    t("doubleClickReset"),
  ].join(" | ");

  const compareStatusHelp =
    compareHelp ||
    [
      `${t("current")}: ${t("syncBothImages")}`,
      t("wheelZoom"),
      t("dragToPan"),
      t("switchBackToSync"),
    ].join(" | ");

  const gridStatusHelp = [
    t("gridShortcutScroll"),
    t("gridShortcutZoomAll"),
    t("gridShortcutPanAll"),
    t("gridShortcutZoomOne"),
    t("gridShortcutPanOne"),
    t("gridShortcutResetOne"),
    t("gridShortcutResetAll"),
  ].join(" | ");

  const currentStatusHelp =
    viewMode === "single"
      ? singleStatusHelp
      : viewMode === "compare"
        ? compareStatusHelp
        : gridStatusHelp;
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <img src={logoImage} alt={`${t("appTitle")} Logo`} />
          </div>

          <div>
            <h1>{t("appTitle")}</h1>
            <p>{t("appSubtitle")}</p>
          </div>
        </div>

        <div className="mode-switch">
          <button
            type="button"
            className={viewMode === "single" ? "active" : ""}
            onClick={() => setViewMode("single")}
            title={t("single")}
            aria-label={t("single")}
          >
            <ImageIcon size={18} />
            <span>{t("single")}</span>
          </button>

          <button
            type="button"
            className={viewMode === "compare" ? "active" : ""}
            onClick={() => setViewMode("compare")}
            title={t("compare")}
            aria-label={t("compare")}
          >
            <Columns2 size={18} />
            <span>{t("compare")}</span>
          </button>

          <button
            type="button"
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
            title={t("grid")}
            aria-label={t("grid")}
          >
            <Grid2X2 size={18} />
            <span>{t("grid")}</span>
          </button>
        </div>

        <div className="topbar-actions">
          <ThemeSwitcher theme={theme} onThemeChange={setTheme} />

          <label
            className="upload-button"
            title={t("importImages")}
            aria-label={t("importImages")}
          >
            <Upload size={18} />
            <span>{t("importImages")}</span>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImport}
            />
          </label>

          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
            title={t("clearImages")}
            aria-label={t("clearImages")}
          >
            <Trash2 size={17} />
            {t("clearImages")}
          </button>
          <LanguageSwitch />
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div>
              <h2>{t("imageList")}</h2>
              <span>
                {images.length} {t("imagesUnit")}
              </span>
            </div>
          </div>

          <div className="image-list">
            {images.length === 0 ? (
              <div className="sidebar-empty">
                <ImageIcon size={32} />
                <span>{t("noImagesImported")}</span>
              </div>
            ) : (
              images.map((image, index) => {
                const isImageA = compareAImage?.id === image.id;
                const isImageB = compareBImage?.id === image.id;

                return (
                  <div
                    key={image.id}
                    className={
                      selectedImage?.id === image.id
                        ? "image-item selected"
                        : "image-item"
                    }
                    onClick={() => setSelectedId(image.id)}
                  >
                    <img src={image.url} alt={image.name} />

                    <div className="image-item-info">
                      <strong title={image.name}>{image.name}</strong>

                      <span>
                        {t("imageNumber")} {index + 1}
                      </span>

                      <div className="image-role-actions">
                        <button
                          className={
                            isImageA
                              ? "role-button role-a active"
                              : "role-button role-a"
                          }
                          title="将这张图片设为 A"
                          onClick={(event) => {
                            event.stopPropagation();
                            setAsImageA(image.id);
                          }}
                        >
                          A
                        </button>

                        <button
                          className={
                            isImageB
                              ? "role-button role-b active"
                              : "role-button role-b"
                          }
                          title="将这张图片设为 B"
                          onClick={(event) => {
                            event.stopPropagation();
                            setAsImageB(image.id);
                          }}
                        >
                          B
                        </button>
                      </div>
                    </div>

                    <button
                      className="delete-image-button"
                      title={t("delete")}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(image.id);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <main className="viewer">
          <div className="viewer-toolbar">
            <div className="current-mode">
              {viewMode === "single" && (
                <>
                  <ImageIcon size={17} />
                  <span>{t("singleView")}</span>
                </>
              )}

              {viewMode === "grid" && (
                <>
                  <Grid3X3 size={17} />
                  <span>{t("gridView")}</span>
                </>
              )}
            </div>
            <div id="viewer-toolbar-center" className="viewer-toolbar-center" />

            <div
              id="viewer-toolbar-actions"
              className="viewer-toolbar-actions"
            />

            <div
              className={
                viewMode === "single"
                  ? "zoom-controls"
                  : "zoom-controls grid-hidden-controls"
              }
            >
              <button
                type="button"
                onClick={zoomOut}
                title={t("zoomOut")}
                aria-label={t("zoomOut")}
              >
                <ZoomOut size={18} />
              </button>

              <button
                className="zoom-value"
                onClick={resetZoom}
                title={t("reset")}
                aria-label={t("reset")}
              >
                {zoom}%
              </button>

              <button
                type="button"
                onClick={zoomIn}
                title={t("zoomIn")}
                aria-label={t("zoomIn")}
              >
                <ZoomIn size={18} />
              </button>

              {viewMode === "single" && (
                <button
                  type="button"
                  onClick={handleRotateClockwise}
                  title={`${t("rotateClockwise")} 90° (R)`}
                  aria-label={`${t("rotateClockwise")} 90°`}
                >
                  ↻
                </button>
              )}

              <button
                type="button"
                onClick={resetZoom}
                title={t("reset")}
                aria-label={t("reset")}
              >
                <Maximize size={17} />
              </button>
            </div>
          </div>

          <div
            ref={canvasRef}
            className={[
              "canvas",
              isDraggingFiles ? "dragging-files" : "",
              isPanning ? "is-panning" : "",
              viewMode !== "grid" ? "can-pan" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onWheel={handleCanvasWheel}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onDoubleClick={handleCanvasDoubleClick}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key.toLowerCase() !== "r" || viewMode !== "single") {
                return;
              }

              event.preventDefault();
              handleRotateClockwise();
            }}
          >
            {images.length === 0 ? (
              <EmptyState
                title={t("startImport")}
                description={t("importDescription")}
                singleText={t("single")}
                compareText={t("compare")}
                gridText={t("grid")}
              />
            ) : (
              <>
                {viewMode === "single" && selectedImage && (
                  <div className="single-view">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.name}
                      draggable={false}
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${
                          zoom / 100
                        }) rotate(${rotation}deg)`,
                      }}
                    />
                  </div>
                )}

                {viewMode === "compare" && (
                  <ABCompareView
                    imageA={compareAImage}
                    imageB={compareBImage}
                    onHelpChange={setCompareHelp}
                  />
                )}
                {viewMode === "grid" && <MultiCompareView images={images} />}
              </>
            )}
          </div>

          <footer className="statusbar">
            <span className="statusbar-count">
              {t("total")} {images.length} {t("imageUnit")}
            </span>

            <span className="statusbar-help" title={currentStatusHelp}>
              {currentStatusHelp}
            </span>

            <span className="statusbar-meta">
              {viewMode === "single" ? (
                <>
                  {rotation}° · {t("zoomLabel")}: {zoom}%
                </>
              ) : viewMode === "compare" ? (
                t("compareView")
              ) : (
                t("gridModeDescription")
              )}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  singleText: string;
  compareText: string;
  gridText: string;
};

function EmptyState({
  title,
  description,
  singleText,
  compareText,
  gridText,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Images size={48} />
      </div>

      <h2>{title}</h2>
      <p>{description}</p>

      <div className="empty-tips">
        <span>{singleText}</span>
        <span>{compareText}</span>
        <span>{gridText}</span>
      </div>
    </div>
  );
}

export default App;
