import { useState, type DragEvent, type KeyboardEvent } from "react";
import {
  GripVertical,
  Image as ImageIcon,
  Trash2,
  Undo2,
} from "lucide-react";
import type { LocalImage } from "../types";
import { useI18n } from "../useI18n";
import { getDragAutoScrollAmount } from "../utils/sidebarReorder";

type Props = {
  images: LocalImage[];
  selectedImageId: string | null;
  compareAId: string | null;
  compareBId: string | null;
  onSelect: (imageId: string) => void;
  onSetAsA: (imageId: string) => void;
  onSetAsB: (imageId: string) => void;
  onReorder: (imageId: string, toIndex: number) => void;
  onUndoReorder: () => void;
  canUndoReorder: boolean;
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
  onReorder,
  onUndoReorder,
  canUndoReorder,
  onDelete,
  onImageLoadError,
}: Props) {
  const { t } = useI18n();
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState("");
  const [dropTarget, setDropTarget] = useState<{
    imageId: string;
    insertionIndex: number;
    edge: "before" | "after";
  } | null>(null);

  function clearDragState() {
    setDraggedImageId(null);
    setDropTarget(null);
  }

  function reorderAndAnnounce(imageId: string, toIndex: number) {
    const fromIndex = images.findIndex((image) => image.id === imageId);

    if (fromIndex < 0) {
      return;
    }

    const insertionIndex = Math.min(images.length, Math.max(0, toIndex));
    const finalIndex =
      fromIndex < insertionIndex ? insertionIndex - 1 : insertionIndex;
    const image = images[fromIndex];

    onReorder(imageId, toIndex);
    setReorderAnnouncement(
      `${t("reorderComplete")}: ${image.name}, ${t("listPosition")} ${finalIndex + 1}`,
    );
  }

  function handleUndoReorder() {
    onUndoReorder();
    setReorderAnnouncement(t("reorderUndone"));
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, imageId: string) {
    setDraggedImageId(imageId);
    setDropTarget(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", imageId);
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    imageId: string,
    index: number,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (draggedImageId === imageId) {
      setDropTarget(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const edge = event.clientY < bounds.top + bounds.height / 2
      ? "before"
      : "after";

    setDropTarget({
      imageId,
      insertionIndex: index + (edge === "after" ? 1 : 0),
      edge,
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const imageId = draggedImageId || event.dataTransfer.getData("text/plain");

    if (imageId && dropTarget) {
      reorderAndAnnounce(imageId, dropTarget.insertionIndex);
    }

    clearDragState();
  }

  function handleReorderKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    imageId: string,
    index: number,
  ) {
    let toIndex: number | null = null;

    if (event.key === "ArrowUp" && index > 0) {
      toIndex = index - 1;
    } else if (event.key === "ArrowDown" && index < images.length - 1) {
      toIndex = index + 2;
    } else if (event.key === "Home" && index > 0) {
      toIndex = 0;
    } else if (event.key === "End" && index < images.length - 1) {
      toIndex = images.length;
    }

    if (toIndex === null) {
      return;
    }

    event.preventDefault();
    reorderAndAnnounce(imageId, toIndex);
  }

  function handleListDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const list = event.currentTarget;
    const bounds = list.getBoundingClientRect();

    if (typeof list.scrollBy !== "function") {
      return;
    }

    const scrollAmount = getDragAutoScrollAmount(
      event.clientY,
      bounds.top,
      bounds.bottom,
    );

    if (scrollAmount !== 0) {
      list.scrollBy({ top: scrollAmount, behavior: "auto" });
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <h2>{t("imageList")}</h2>
          <span>
            {images.length} {t("imagesUnit")}
          </span>
        </div>
        <button
          type="button"
          className="undo-reorder-button"
          title={t("undoReorder")}
          aria-label={t("undoReorder")}
          disabled={!canUndoReorder}
          onClick={handleUndoReorder}
        >
          <Undo2 size={15} />
          <span>{t("undoReorder")}</span>
        </button>
      </div>

      <div className="image-list" onDragOver={handleListDragOver}>
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
                className={[
                  "image-item",
                  selectedImageId === image.id ? "selected" : "",
                  draggedImageId === image.id ? "is-dragging" : "",
                  dropTarget?.imageId === image.id
                    ? `is-drop-${dropTarget.edge}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onDragOver={(event) => handleDragOver(event, image.id, index)}
                onDrop={handleDrop}
              >
                <button
                  type="button"
                  className="image-reorder-handle"
                  draggable
                  title={`${t("reorderImage")}: ${image.name}`}
                  aria-label={`${t("reorderImage")}: ${image.name}. ${t("reorderImageHint")}`}
                  onDragStart={(event) => handleDragStart(event, image.id)}
                  onDragEnd={clearDragState}
                  onKeyDown={(event) =>
                    handleReorderKeyDown(event, image.id, index)
                  }
                >
                  <GripVertical size={15} />
                </button>

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
                    loading="lazy"
                    decoding="async"
                    draggable={false}
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

      <div className="visually-hidden" role="status" aria-live="polite">
        {reorderAnnouncement}
      </div>
    </aside>
  );
}
