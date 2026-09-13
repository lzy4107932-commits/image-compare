import type { ChangeEvent } from "react";
import {
  Columns2,
  Grid2X2,
  Image as ImageIcon,
  Trash2,
  Upload,
} from "lucide-react";
import logoImage from "../assets/logo.png";
import type { Theme, ViewMode } from "../types";
import { useI18n } from "../useI18n";
import LanguageSwitch from "./LanguageSwitch";
import ThemeSwitcher from "./ThemeSwitcher";

type Props = {
  theme: Theme;
  viewMode: ViewMode;
  onThemeChange: (theme: Theme) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
};

export default function AppHeader({
  theme,
  viewMode,
  onThemeChange,
  onViewModeChange,
  onImport,
  onClear,
}: Props) {
  const { t } = useI18n();

  return (
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
          onClick={() => onViewModeChange("single")}
          title={t("single")}
          aria-label={t("single")}
        >
          <ImageIcon size={18} />
          <span>{t("single")}</span>
        </button>

        <button
          type="button"
          className={viewMode === "compare" ? "active" : ""}
          onClick={() => onViewModeChange("compare")}
          title={t("compare")}
          aria-label={t("compare")}
        >
          <Columns2 size={18} />
          <span>{t("compare")}</span>
        </button>

        <button
          type="button"
          className={viewMode === "grid" ? "active" : ""}
          onClick={() => onViewModeChange("grid")}
          title={t("grid")}
          aria-label={t("grid")}
        >
          <Grid2X2 size={18} />
          <span>{t("grid")}</span>
        </button>
      </div>

      <div className="topbar-actions">
        <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />

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
            onChange={onImport}
          />
        </label>

        <button
          type="button"
          className="clear-button"
          onClick={onClear}
          title={t("clearImages")}
          aria-label={t("clearImages")}
        >
          <Trash2 size={17} />
          {t("clearImages")}
        </button>

        <LanguageSwitch />
      </div>
    </header>
  );
}
