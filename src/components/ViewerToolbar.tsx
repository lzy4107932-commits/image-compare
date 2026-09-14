import {
  Grid3X3,
  Image as ImageIcon,
  Maximize,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ViewMode } from "../types";
import { useI18n } from "../useI18n";

type Props = {
  viewMode: ViewMode;
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onReset: () => void;
  onRotate: () => void;
};

export default function ViewerToolbar({
  viewMode,
  zoom,
  onZoomOut,
  onZoomIn,
  onReset,
  onRotate,
}: Props) {
  const { t } = useI18n();

  return (
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
      <div id="viewer-toolbar-actions" className="viewer-toolbar-actions" />

      <div
        className={
          viewMode === "single"
            ? "zoom-controls"
            : "zoom-controls grid-hidden-controls"
        }
      >
        <button
          type="button"
          onClick={onZoomOut}
          title={t("zoomOut")}
          aria-label={t("zoomOut")}
        >
          <ZoomOut size={18} />
        </button>

        <button
          type="button"
          className="zoom-value"
          onClick={onReset}
          title={t("reset")}
          aria-label={t("reset")}
        >
          {zoom}%
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          title={t("zoomIn")}
          aria-label={t("zoomIn")}
        >
          <ZoomIn size={18} />
        </button>

        {viewMode === "single" && (
          <button
            type="button"
            onClick={onRotate}
            title={`${t("rotateClockwise")} 90° (R)`}
            aria-label={`${t("rotateClockwise")} 90°`}
          >
            ↻
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          title={t("reset")}
          aria-label={t("reset")}
        >
          <Maximize size={17} />
        </button>
      </div>
    </div>
  );
}
