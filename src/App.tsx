import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChangeEvent,
  DragEvent,
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import AppHeader from "./components/AppHeader";
import EmptyState from "./components/EmptyState";
import ImageSidebar from "./components/ImageSidebar";
import ImportNotice from "./components/ImportNotice";
import StatusBar from "./components/StatusBar";
import SingleImageView from "./components/SingleImageView";
import ViewerToolbar from "./components/ViewerToolbar";
import { useImageLibrary } from "./hooks/useImageLibrary";
import { useI18n } from "./useI18n";
import "./App.css";
import MultiCompareView from "./components/MultiCompareView";
import ABCompareView from "./components/ABCompareView";
import type { Theme, ViewMode } from "./types";
import {
  getViewerKeyboardAction,
  isTextEditingTarget,
} from "./utils/viewerKeyboard";

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
  const imageLibrary = useImageLibrary();
  const {
    images,
    selectedId,
    selectedImage,
    compareAImage,
    compareBImage,
    importNotice,
    addImageFiles,
    selectImage,
    setAsImageA,
    setAsImageB,
    reorderImage,
    undoReorder,
    canUndoReorder,
    restoreImportOrder,
    canRestoreImportOrder,
    deleteImage,
    handleImageLoadError,
    clearImages,
    dismissImportNotice,
  } = imageLibrary;
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const { t } = useI18n();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [compareHelp, setCompareHelp] = useState("");
  const [showFileNames, setShowFileNames] = useState(
    () => localStorage.getItem("image-compare-show-file-names") !== "false",
  );
  const toggleFileNames = useCallback(() => {
    setShowFileNames((current) => !current);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "image-compare-show-file-names",
      String(showFileNames),
    );
  }, [showFileNames]);

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

  const selectImageWithReset = useCallback((imageId: string) => {
    selectImage(imageId);
    setZoom(100);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
  }, [selectImage]);

  const panStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    panX: 0,
    panY: 0,
  });
  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      if (isTextEditingTarget(event.target)) {
        return;
      }

      const action = getViewerKeyboardAction({
        key: event.key,
        viewMode,
        imageCount: images.length,
      });

      if (!action) {
        return;
      }

      if (action === "stop-panning") {
        setIsPanning(false);
        return;
      }

      event.preventDefault();

      if (action === "zoom-in") {
        setZoom((currentZoom) => Math.min(currentZoom + 10, 500));
        return;
      }

      if (action === "zoom-out") {
        setZoom((currentZoom) => Math.max(currentZoom - 10, 10));
        return;
      }

      if (action === "reset-view") {
        setZoom(100);
        setRotation(0);
        setPan({
          x: 0,
          y: 0,
        });
        setIsPanning(false);
        return;
      }

      if (action === "rotate-clockwise") {
        setRotation((currentRotation) => (currentRotation + 90) % 360);
        return;
      }

      const currentIndex = images.findIndex((image) => image.id === selectedId);

      if (action === "select-previous") {
        const previousIndex =
          currentIndex <= 0 ? images.length - 1 : currentIndex - 1;

        selectImageWithReset(images[previousIndex].id);
        return;
      }

      const nextIndex =
        currentIndex < 0 || currentIndex >= images.length - 1
          ? 0
          : currentIndex + 1;

      selectImageWithReset(images[nextIndex].id);
    }

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [images, selectImageWithReset, selectedId, viewMode]);

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

  function handleClear() {
    clearImages();
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

  function resetView() {
    setZoom(100);
    setRotation(0);
    setPan({
      x: 0,
      y: 0,
    });
    setIsPanning(false);
  }

  function handleCanvasWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (viewMode !== "single") {
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
    if (viewMode !== "single") {
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
    if (viewMode !== "single") {
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
    t("singleKeyboardHelp"),
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
    t("gridKeyboardHelp"),
  ].join(" | ");

  const currentStatusHelp =
    viewMode === "single"
      ? singleStatusHelp
      : viewMode === "compare"
        ? compareStatusHelp
        : gridStatusHelp;
  const currentCompactStatusHelp =
    viewMode === "single"
      ? t("singleKeyboardHelp")
      : viewMode === "compare"
        ? t("compareKeyboardHelp")
        : t("gridKeyboardHelp");
  return (
    <div className="app">
      <AppHeader
        theme={theme}
        viewMode={viewMode}
        onThemeChange={setTheme}
        onViewModeChange={setViewMode}
        onImport={handleImport}
        onClear={handleClear}
      />

      <ImportNotice
        message={importNotice}
        onDismiss={dismissImportNotice}
      />

      <div className="workspace">
        <ImageSidebar
          images={images}
          selectedImageId={selectedImage?.id ?? null}
          compareAId={compareAImage?.id ?? null}
          compareBId={compareBImage?.id ?? null}
          onSelect={selectImageWithReset}
          onSetAsA={setAsImageA}
          onSetAsB={setAsImageB}
          onReorder={reorderImage}
          onUndoReorder={undoReorder}
          canUndoReorder={canUndoReorder}
          onRestoreImportOrder={restoreImportOrder}
          canRestoreImportOrder={canRestoreImportOrder}
          onDelete={deleteImage}
          onImageLoadError={handleImageLoadError}
        />

        <main className="viewer">
          <ViewerToolbar
            viewMode={viewMode}
            zoom={zoom}
            rotation={rotation}
            onZoomOut={zoomOut}
            onZoomIn={zoomIn}
            onReset={resetView}
            onRotate={handleRotateClockwise}
            showFileNames={showFileNames}
            onToggleFileNames={toggleFileNames}
          />

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
          >
            {images.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {viewMode === "single" && selectedImage && (
                  <SingleImageView
                    image={selectedImage}
                    showFileName={showFileNames}
                    rotation={rotation}
                    onImageLoadError={handleImageLoadError}
                    transform={`translate(${pan.x}px, ${pan.y}px) scale(${
                      zoom / 100
                    }) rotate(${rotation}deg)`}
                  />
                )}

                {viewMode === "compare" && (
                  <ABCompareView
                    imageA={compareAImage}
                    imageB={compareBImage}
                    onHelpChange={setCompareHelp}
                    showFileNames={showFileNames}
                    onImageLoadError={handleImageLoadError}
                    onToggleFileNames={toggleFileNames}
                  />
                )}
                {viewMode === "grid" && (
                  <MultiCompareView
                    images={images}
                    showFileNames={showFileNames}
                    onImageLoadError={handleImageLoadError}
                    onToggleFileNames={toggleFileNames}
                  />
                )}
              </>
            )}
          </div>

          <StatusBar
            imageCount={images.length}
            viewMode={viewMode}
            rotation={rotation}
            zoom={zoom}
            help={currentStatusHelp}
            compactHelp={currentCompactStatusHelp}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
