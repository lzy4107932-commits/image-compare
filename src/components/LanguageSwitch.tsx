import { Languages } from "lucide-react";
import { useI18n } from "../useI18n";

export default function LanguageSwitch() {
  const { language, toggleLanguage, t } = useI18n();

  return (
    <button
      type="button"
      className="language-switch"
      onClick={toggleLanguage}
      title={t("language")}
      aria-label={t("language")}
    >
      <Languages size={16} />
      <span>{language === "zh" ? "中" : "EN"}</span>
    </button>
  );
}
