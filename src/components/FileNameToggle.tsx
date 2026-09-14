import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "../useI18n";

type Props = {
  showFileNames: boolean;
  onToggle: () => void;
};

export default function FileNameToggle({ showFileNames, onToggle }: Props) {
  const { t } = useI18n();
  const actionLabel = showFileNames
    ? t("hideFileNames")
    : t("showFileNames");

  return (
    <button
      type="button"
      className="file-name-toggle"
      title={actionLabel}
      aria-label={actionLabel}
      aria-pressed={showFileNames}
      onClick={onToggle}
    >
      {showFileNames ? <Eye size={16} /> : <EyeOff size={16} />}
      <span>{t("fileNames")}</span>
    </button>
  );
}
