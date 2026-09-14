type Props = {
  fileName: string;
  className?: string;
  prefix?: string;
};

function splitFileName(fileName: string) {
  const extensionStart = fileName.lastIndexOf(".");

  if (extensionStart <= 0 || extensionStart === fileName.length - 1) {
    return { stem: fileName, extension: "" };
  }

  return {
    stem: fileName.slice(0, extensionStart),
    extension: fileName.slice(extensionStart),
  };
}

export default function FileNameOverlay({
  fileName,
  className = "",
  prefix = "",
}: Props) {
  const { stem, extension } = splitFileName(fileName);

  return (
    <div
      className={["viewer-file-name", className].filter(Boolean).join(" ")}
      title={fileName}
    >
      {prefix && <span className="file-name-prefix">{prefix}</span>}
      <span className="file-name-stem">{stem}</span>
      {extension && <span className="file-name-extension">{extension}</span>}
    </div>
  );
}
