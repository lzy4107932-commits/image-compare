import { useI18n } from "../useI18n";

type Props = {
  message: string | null;
  onDismiss: () => void;
};

export default function ImportNotice({ message, onDismiss }: Props) {
  const { t } = useI18n();

  if (!message) {
    return null;
  }

  return (
    <div className="import-notice" role="alert">
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("dismissNotice")}
        title={t("dismissNotice")}
      >
        ×
      </button>
    </div>
  );
}
