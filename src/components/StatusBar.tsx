import type { ViewMode } from "../types";
import { useI18n } from "../useI18n";

type Props = {
  imageCount: number;
  viewMode: ViewMode;
  rotation: number;
  zoom: number;
  help: string;
};

export default function StatusBar({
  imageCount,
  viewMode,
  rotation,
  zoom,
  help,
}: Props) {
  const { t } = useI18n();

  return (
    <footer className="statusbar">
      <span className="statusbar-count">
        {t("total")} {imageCount} {t("imageUnit")}
      </span>

      <span className="statusbar-help" title={help}>
        {help}
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
  );
}
