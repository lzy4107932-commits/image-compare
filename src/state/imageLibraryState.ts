import type { LocalImage } from "../types";

export type ImageLibraryState = {
  images: LocalImage[];
  selectedId: string | null;
  compareAId: string | null;
  compareBId: string | null;
};

export type ImageLibraryAction =
  | { type: "add"; images: LocalImage[] }
  | { type: "set-thumbnail"; imageId: string; thumbnailUrl: string }
  | { type: "select"; imageId: string }
  | { type: "set-a"; imageId: string }
  | { type: "set-b"; imageId: string }
  | { type: "reorder"; imageId: string; toIndex: number }
  | { type: "restore-order"; imageIds: string[] }
  | { type: "delete"; imageId: string }
  | { type: "clear" };

export const INITIAL_IMAGE_LIBRARY_STATE: ImageLibraryState = {
  images: [],
  selectedId: null,
  compareAId: null,
  compareBId: null,
};

export function getSelectedImage(state: ImageLibraryState) {
  return (
    state.images.find((image) => image.id === state.selectedId) ??
    state.images[0] ??
    null
  );
}

export function getCompareAImage(state: ImageLibraryState) {
  return (
    state.images.find((image) => image.id === state.compareAId) ??
    state.images[0] ??
    null
  );
}

export function getCompareBImage(state: ImageLibraryState) {
  const imageA = getCompareAImage(state);
  const savedImage = state.images.find(
    (image) => image.id === state.compareBId && image.id !== imageA?.id,
  );

  return (
    savedImage ??
    state.images.find((image) => image.id !== imageA?.id) ??
    null
  );
}

export function imageLibraryReducer(
  state: ImageLibraryState,
  action: ImageLibraryAction,
): ImageLibraryState {
  switch (action.type) {
    case "add":
      if (action.images.length === 0) {
        return state;
      }

      return {
        images: [...state.images, ...action.images],
        selectedId: state.selectedId ?? action.images[0]?.id ?? null,
        compareAId: state.compareAId ?? action.images[0]?.id ?? null,
        compareBId: state.compareBId ?? action.images[1]?.id ?? null,
      };

    case "set-thumbnail": {
      const imageIndex = state.images.findIndex(
        (image) => image.id === action.imageId,
      );

      if (imageIndex < 0) {
        return state;
      }

      const images = [...state.images];
      images[imageIndex] = {
        ...images[imageIndex],
        thumbnailUrl: action.thumbnailUrl,
      };

      return { ...state, images };
    }

    case "select":
      return state.images.some((image) => image.id === action.imageId)
        ? { ...state, selectedId: action.imageId }
        : state;

    case "set-a": {
      if (!state.images.some((image) => image.id === action.imageId)) {
        return state;
      }

      const currentA = getCompareAImage(state);
      const currentB = getCompareBImage(state);

      return {
        ...state,
        compareAId: action.imageId,
        compareBId:
          action.imageId === currentB?.id
            ? currentA?.id ?? null
            : state.compareBId,
      };
    }

    case "set-b": {
      if (!state.images.some((image) => image.id === action.imageId)) {
        return state;
      }

      const currentA = getCompareAImage(state);
      const currentB = getCompareBImage(state);

      return {
        ...state,
        compareAId:
          action.imageId === currentA?.id
            ? currentB?.id ?? null
            : state.compareAId,
        compareBId: action.imageId,
      };
    }

    case "reorder": {
      const fromIndex = state.images.findIndex(
        (image) => image.id === action.imageId,
      );

      if (fromIndex < 0) {
        return state;
      }

      const insertionIndex = Math.min(
        state.images.length,
        Math.max(0, action.toIndex),
      );
      const nextImages = state.images.filter(
        (image) => image.id !== action.imageId,
      );
      const adjustedIndex =
        fromIndex < insertionIndex ? insertionIndex - 1 : insertionIndex;

      if (adjustedIndex === fromIndex) {
        return state;
      }

      nextImages.splice(adjustedIndex, 0, state.images[fromIndex]);

      return { ...state, images: nextImages };
    }

    case "restore-order": {
      if (
        action.imageIds.length !== state.images.length ||
        new Set(action.imageIds).size !== state.images.length
      ) {
        return state;
      }

      const imagesById = new Map(
        state.images.map((image) => [image.id, image] as const),
      );
      const images = action.imageIds.map((imageId) => imagesById.get(imageId));

      if (images.some((image) => !image)) {
        return state;
      }

      return { ...state, images: images as LocalImage[] };
    }

    case "delete": {
      if (!state.images.some((image) => image.id === action.imageId)) {
        return state;
      }

      const selectedImage = getSelectedImage(state);
      const imageA = getCompareAImage(state);
      const imageB = getCompareBImage(state);
      const images = state.images.filter((image) => image.id !== action.imageId);
      let compareAId = state.compareAId;
      let compareBId = state.compareBId;

      if (imageA?.id === action.imageId) {
        compareAId = images[0]?.id ?? null;
      }

      if (imageB?.id === action.imageId) {
        const nextA =
          images.find((image) => image.id === compareAId) ?? images[0] ?? null;
        compareBId =
          images.find((image) => image.id !== nextA?.id)?.id ?? null;
      }

      return {
        images,
        selectedId:
          selectedImage?.id === action.imageId
            ? images[0]?.id ?? null
            : state.selectedId,
        compareAId,
        compareBId,
      };
    }

    case "clear":
      return INITIAL_IMAGE_LIBRARY_STATE;
  }
}
