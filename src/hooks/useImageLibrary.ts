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
  selectImportableImages,
} from "../utils/imageImport";

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

  const applyAction = useCallback((action: ImageLibraryAction) => {
    const nextState = imageLibraryReducer(stateRef.current, action);
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  useEffect(() => {
    return () => {
      stateRef.current.images.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
      stateRef.current = INITIAL_IMAGE_LIBRARY_STATE;
    };
  }, []);

  const addImageFiles = useCallback(
    (fileList: FileList | File[]) => {
      const selection = selectImportableImages(
        Array.from(fileList),
        stateRef.current.images.length,
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

      setImportNotice(notices.length > 0 ? notices.join(" · ") : null);

      if (selection.accepted.length === 0) {
        return;
      }

      const images: LocalImage[] = selection.accepted.map((file, index) => ({
        id: createImageId(file, index),
        name: file.name,
        url: URL.createObjectURL(file),
      }));

      applyAction({ type: "add", images });
    },
    [applyAction, t],
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

  const deleteImage = useCallback(
    (imageId: string) => {
      const target = stateRef.current.images.find(
        (image) => image.id === imageId,
      );

      if (!target) {
        return;
      }

      URL.revokeObjectURL(target.url);
      applyAction({ type: "delete", imageId });
    },
    [applyAction],
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
      URL.revokeObjectURL(image.url);
    });
    applyAction({ type: "clear" });
    setImportNotice(null);
  }, [applyAction]);

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
    deleteImage,
    handleImageLoadError,
    clearImages,
    dismissImportNotice: () => setImportNotice(null),
  };
}
