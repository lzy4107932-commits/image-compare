import { Images } from "lucide-react";
import { useI18n } from "../useI18n";

export default function EmptyState() {
  const { t } = useI18n();

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Images size={48} />
      </div>

      <h2>{t("startImport")}</h2>
      <p>{t("importDescription")}</p>

      <div className="empty-tips">
        <span>{t("single")}</span>
        <span>{t("compare")}</span>
        <span>{t("grid")}</span>
      </div>
    </div>
  );
}
