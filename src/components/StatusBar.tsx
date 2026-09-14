import type { ViewMode } from "../types";
import { useI18n } from "../useI18n";

type Props = {
  imageCount: number;
  viewMode: ViewMode;
  rotation: number;
  zoom: number;
  help: string;
  compactHelp: string;
};

export default function StatusBar({
  imageCount,
  viewMode,
  rotation,
  zoom,
  help,
  compactHelp,
}: Props) {
  const { t } = useI18n();

  return (
    <footer className="statusbar">
      <span className="statusbar-count">
        {t("total")} {imageCount} {t("imageUnit")}
      </span>

      <span className="statusbar-help" title={help}>
        <span className="statusbar-help-full">{help}</span>
        <span className="statusbar-help-compact">{compactHelp}</span>
      </span>

      <span className="statusbar-meta">
        <span className="statusbar-meta-full">
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
        <span className="statusbar-meta-compact">
          {viewMode === "single"
            ? `${zoom}% · ${rotation}°`
            : viewMode === "compare"
              ? t("compare")
              : t("grid")}
        </span>
      </span>
    </footer>
  );
}
