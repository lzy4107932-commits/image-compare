import type { LocalImage } from "../types";

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
        src={image.url}
        alt={image.name}
        decoding="async"
        draggable={false}
        style={{ transform }}
      />
      {showFileName && (
        <div className="viewer-file-name single-file-name" title={image.name}>
          {image.name}
        </div>
      )}
    </div>
  );
}
