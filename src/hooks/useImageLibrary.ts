import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCompareAImage,
  getCompareBImage,
  getSelectedImage,
  imageLibraryReducer,
  INITIAL_IMAGE_LIBRARY_STATE,
  type ImageLibraryAction,
  type ImageLibraryState,
} from "../state/imageLibraryState";
import type { LocalImage } from "../types";
import { useI18n } from "../useI18n";
import {
  MAX_IMAGE_COUNT,
  MAX_IMAGE_FILE_MIB,
  MAX_TOTAL_IMAGE_MIB,
  selectImportableImages,
} from "../utils/imageImport";
import {
  AsyncTaskQueue,
  createImageThumbnail,
  revokeImageObjectUrls,
  THUMBNAIL_CONCURRENCY,
} from "../utils/imageThumbnail";

function createImageId(file: File, index: number) {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${index}-${file.name}`;
}

export function useImageLibrary() {
  const { t } = useI18n();
  const stateRef = useRef<ImageLibraryState>(INITIAL_IMAGE_LIBRARY_STATE);
  const [state, setState] = useState<ImageLibraryState>(
    INITIAL_IMAGE_LIBRARY_STATE,
  );
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const previousOrderRef = useRef<string[] | null>(null);
  const importOrderRef = useRef<string[]>([]);
  const [canUndoReorder, setCanUndoReorder] = useState(false);
  const [canRestoreImportOrder, setCanRestoreImportOrder] = useState(false);
  const [thumbnailQueue] = useState(
    () => new AsyncTaskQueue(THUMBNAIL_CONCURRENCY),
  );

  const updateCanRestoreImportOrder = useCallback(() => {
    const currentOrder = stateRef.current.images.map((image) => image.id);
    const importOrder = importOrderRef.current;

    setCanRestoreImportOrder(
      currentOrder.length === importOrder.length &&
        currentOrder.some((imageId, index) => imageId !== importOrder[index]),
    );
  }, []);

  const applyAction = useCallback((action: ImageLibraryAction) => {
    const nextState = imageLibraryReducer(stateRef.current, action);
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  useEffect(() => {
    return () => {
      stateRef.current.images.forEach((image) => {
        revokeImageObjectUrls(image);
      });
      thumbnailQueue.clear();
      stateRef.current = INITIAL_IMAGE_LIBRARY_STATE;
      importOrderRef.current = [];
      previousOrderRef.current = null;
    };
  }, [thumbnailQueue]);

  const addImageFiles = useCallback(
    (fileList: FileList | File[]) => {
      const selection = selectImportableImages(
        Array.from(fileList),
        stateRef.current.images.length,
        stateRef.current.images.reduce((total, image) => total + image.size, 0),
      );
      const notices: string[] = [];

      if (selection.rejectedType > 0) {
        notices.push(
          `${t("unsupportedImagesSkipped")}: ${selection.rejectedType}`,
        );
      }

      if (selection.rejectedSize > 0) {
        notices.push(
          `${t("oversizedImagesSkipped")} (${MAX_IMAGE_FILE_MIB} MiB): ${selection.rejectedSize}`,
        );
      }

      if (selection.rejectedCount > 0) {
        notices.push(
          `${t("imageCountLimitReached")} (${MAX_IMAGE_COUNT}): ${selection.rejectedCount}`,
        );
      }


      if (selection.rejectedTotalSize > 0) {
        notices.push(
          `${t("totalImageSizeLimitReached")} (${MAX_TOTAL_IMAGE_MIB} MiB): ${selection.rejectedTotalSize}`,
        );
      }

      setImportNotice(notices.length > 0 ? notices.join(" · ") : null);

      if (selection.accepted.length === 0) {
        return;
      }

      const images: LocalImage[] = selection.accepted.map((file, index) => ({
        id: createImageId(file, index),
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
      }));

      previousOrderRef.current = null;
      setCanUndoReorder(false);
      importOrderRef.current.push(...images.map((image) => image.id));
      applyAction({ type: "add", images });
      updateCanRestoreImportOrder();

      images.forEach((image, index) => {
        const file = selection.accepted[index];

        thumbnailQueue.enqueue(async () => {
          if (!stateRef.current.images.some(({ id }) => id === image.id)) {
            return;
          }

          const thumbnail = await createImageThumbnail(file);

          if (!thumbnail) {
            return;
          }

          const thumbnailUrl = URL.createObjectURL(thumbnail);

          if (!stateRef.current.images.some(({ id }) => id === image.id)) {
            URL.revokeObjectURL(thumbnailUrl);
            return;
          }

          applyAction({
            type: "set-thumbnail",
            imageId: image.id,
            thumbnailUrl,
          });
        });
      });
    },
    [applyAction, t, thumbnailQueue, updateCanRestoreImportOrder],
  );

  const selectImage = useCallback(
    (imageId: string) => applyAction({ type: "select", imageId }),
    [applyAction],
  );
  const setAsImageA = useCallback(
    (imageId: string) => applyAction({ type: "set-a", imageId }),
    [applyAction],
  );
  const setAsImageB = useCallback(
    (imageId: string) => applyAction({ type: "set-b", imageId }),
    [applyAction],
  );
  const reorderImage = useCallback(
    (imageId: string, toIndex: number) => {
      const currentImages = stateRef.current.images;
      const fromIndex = currentImages.findIndex((image) => image.id === imageId);

      if (fromIndex < 0) {
        return;
      }

      const insertionIndex = Math.min(
        currentImages.length,
        Math.max(0, toIndex),
      );
      const finalIndex =
        fromIndex < insertionIndex ? insertionIndex - 1 : insertionIndex;

      if (finalIndex === fromIndex) {
        return;
      }

      previousOrderRef.current = currentImages.map((image) => image.id);
      setCanUndoReorder(true);
      applyAction({ type: "reorder", imageId, toIndex });
      updateCanRestoreImportOrder();
    },
    [applyAction, updateCanRestoreImportOrder],
  );
  const undoReorder = useCallback(() => {
    const imageIds = previousOrderRef.current;

    if (!imageIds) {
      return;
    }

    applyAction({ type: "restore-order", imageIds });
    previousOrderRef.current = null;
    setCanUndoReorder(false);
    updateCanRestoreImportOrder();
  }, [applyAction, updateCanRestoreImportOrder]);
  const restoreImportOrder = useCallback(() => {
    if (!canRestoreImportOrder) {
      return;
    }

    previousOrderRef.current = stateRef.current.images.map((image) => image.id);
    setCanUndoReorder(true);
    applyAction({
      type: "restore-order",
      imageIds: importOrderRef.current,
    });
    updateCanRestoreImportOrder();
  }, [applyAction, canRestoreImportOrder, updateCanRestoreImportOrder]);

  const deleteImage = useCallback(
    (imageId: string) => {
      const target = stateRef.current.images.find(
        (image) => image.id === imageId,
      );

      if (!target) {
        return;
      }

      previousOrderRef.current = null;
      setCanUndoReorder(false);
      importOrderRef.current = importOrderRef.current.filter(
        (currentId) => currentId !== imageId,
      );
      revokeImageObjectUrls(target);
      applyAction({ type: "delete", imageId });
      updateCanRestoreImportOrder();
    },
    [applyAction, updateCanRestoreImportOrder],
  );

  const handleImageLoadError = useCallback(
    (imageId: string) => {
      if (!stateRef.current.images.some((image) => image.id === imageId)) {
        return;
      }

      setImportNotice(t("imageLoadFailed"));
      deleteImage(imageId);
    },
    [deleteImage, t],
  );

  const clearImages = useCallback(() => {
    stateRef.current.images.forEach((image) => {
      revokeImageObjectUrls(image);
    });
    thumbnailQueue.clear();
    applyAction({ type: "clear" });
    previousOrderRef.current = null;
    importOrderRef.current = [];
    setCanUndoReorder(false);
    setCanRestoreImportOrder(false);
    setImportNotice(null);
  }, [applyAction, thumbnailQueue]);

  return {
    images: state.images,
    selectedId: state.selectedId,
    selectedImage: getSelectedImage(state),
    compareAImage: getCompareAImage(state),
    compareBImage: getCompareBImage(state),
    importNotice,
    addImageFiles,
    selectImage,
    setAsImageA,
    setAsImageB,
    reorderImage,
    undoReorder,
    canUndoReorder,
    restoreImportOrder,
    canRestoreImportOrder,
    deleteImage,
    handleImageLoadError,
    clearImages,
    dismissImportNotice: () => setImportNotice(null),
  };
}
