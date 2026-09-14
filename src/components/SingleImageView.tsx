import type { LocalImage } from "../types";
import FileNameOverlay from "./FileNameOverlay";

type Props = {
  image: LocalImage;
  showFileName: boolean;
  transform: string;
};

export default function SingleImageView({
  image,
  showFileName,
  transform,
}: Props) {
  return (
    <div className="single-view">
      <img
        className="single-view-image"
        src={image.url}
        alt={image.name}
        decoding="async"
        draggable={false}
        style={{ transform }}
      />
      {showFileName && (
        <FileNameOverlay fileName={image.name} className="single-file-name" />
      )}
    </div>
  );
}
