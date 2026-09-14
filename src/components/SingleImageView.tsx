import type { LocalImage } from "../types";
import FileNameOverlay from "./FileNameOverlay";

type Props = {
  image: LocalImage;
  showFileName: boolean;
  rotation: number;
  transform: string;
  onImageLoadError?: (imageId: string) => void;
};

export default function SingleImageView({
  image,
  showFileName,
  rotation,
  transform,
  onImageLoadError,
}: Props) {
  const isQuarterTurn = Math.abs(rotation % 180) === 90;

  return (
    <div className="single-view">
      <img
        className={
          isQuarterTurn
            ? "single-view-image is-quarter-turn"
            : "single-view-image"
        }
        src={image.url}
        alt={image.name}
        decoding="async"
        draggable={false}
        onError={() => onImageLoadError?.(image.id)}
        style={{ transform }}
      />
      {showFileName && (
        <FileNameOverlay fileName={image.name} className="single-file-name" />
      )}
    </div>
  );
}
