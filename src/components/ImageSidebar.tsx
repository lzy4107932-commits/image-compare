import { Image as ImageIcon, Trash2 } from "lucide-react";
import type { LocalImage } from "../types";
import { useI18n } from "../useI18n";

type Props = {
  images: LocalImage[];
  selectedImageId: string | null;
  compareAId: string | null;
  compareBId: string | null;
  onSelect: (imageId: string) => void;
  onSetAsA: (imageId: string) => void;
  onSetAsB: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  onImageLoadError: (imageId: string) => void;
};

export default function ImageSidebar({
  images,
  selectedImageId,
  compareAId,
  compareBId,
  onSelect,
  onSetAsA,
  onSetAsB,
  onDelete,
  onImageLoadError,
}: Props) {
  const { t } = useI18n();

  return (
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
            const isImageA = compareAId === image.id;
            const isImageB = compareBId === image.id;

            return (
              <div
                key={image.id}
                className={
                  selectedImageId === image.id
                    ? "image-item selected"
                    : "image-item"
                }
              >
                <button
                  type="button"
                  className="image-item-select"
                  onClick={() => onSelect(image.id)}
                  aria-label={`${t("selectImage")}: ${image.name}`}
                  aria-pressed={selectedImageId === image.id}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    onError={() => onImageLoadError(image.id)}
                  />

                  <div className="image-item-info">
                    <strong title={image.name}>{image.name}</strong>

                    <span>
                      {t("imageNumber")} {index + 1}
                    </span>
                  </div>
                </button>

                <div className="image-role-actions">
                  <button
                    type="button"
                    className={
                      isImageA
                        ? "role-button role-a active"
                        : "role-button role-a"
                    }
                    title={t("setAsImageA")}
                    aria-label={`${t("setAsImageA")}: ${image.name}`}
                    onClick={() => onSetAsA(image.id)}
                  >
                    A
                  </button>

                  <button
                    type="button"
                    className={
                      isImageB
                        ? "role-button role-b active"
                        : "role-button role-b"
                    }
                    title={t("setAsImageB")}
                    aria-label={`${t("setAsImageB")}: ${image.name}`}
                    onClick={() => onSetAsB(image.id)}
                  >
                    B
                  </button>
                </div>

                <button
                  type="button"
                  className="delete-image-button"
                  title={t("delete")}
                  aria-label={`${t("delete")}: ${image.name}`}
                  onClick={() => onDelete(image.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
