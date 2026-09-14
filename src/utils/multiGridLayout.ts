const DEFAULT_GRID_GAP = 2;
const DEFAULT_MIN_CARD_WIDTH = 220;
const DEFAULT_MIN_CARD_HEIGHT = 180;

function formatCssNumber(value: number) {
  return Number(value.toFixed(6));
}

/**
 * Keep the common comparison sets visually balanced instead of allowing
 * auto-fill to leave a single card aligned to the left of the last row.
 */
export function getPreferredMultiGridColumns(imageCount: number) {
  if (imageCount <= 0) {
    return 1;
  }

  if (imageCount <= 3) {
    return imageCount;
  }

  if (imageCount === 4) {
    return 2;
  }

  if (imageCount <= 6) {
    return 3;
  }

  if (imageCount <= 8) {
    return 4;
  }

  return Math.ceil(Math.sqrt(imageCount));
}

/**
 * The minimum width makes cards wrap on narrow viewers. The flex container
 * centers every row, so a partial final row remains centered automatically.
 */
export function getMultiGridCardBasis(
  columns: number,
  gap = DEFAULT_GRID_GAP,
  minCardWidth = DEFAULT_MIN_CARD_WIDTH,
) {
  const safeColumns = Math.max(1, Math.floor(columns));
  const percentage = formatCssNumber(100 / safeColumns);
  const gapShare = formatCssNumber(
    (gap * Math.max(0, safeColumns - 1)) / safeColumns,
  );

  return `min(100%, max(${minCardWidth}px, calc(${percentage}% - ${gapShare}px)))`;
}

export function getResponsiveMultiGridColumns(
  imageCount: number,
  containerWidth: number,
  gap = DEFAULT_GRID_GAP,
  minCardWidth = DEFAULT_MIN_CARD_WIDTH,
) {
  const preferredColumns = getPreferredMultiGridColumns(imageCount);

  if (containerWidth <= 0) {
    return preferredColumns;
  }

  const availableWidth = Math.max(0, containerWidth - gap * 2);
  const fittingColumns = Math.max(
    1,
    Math.floor((availableWidth + gap) / (minCardWidth + gap)),
  );

  return Math.min(preferredColumns, fittingColumns);
}

export function getMultiGridCardHeight(
  rows: number,
  gap = DEFAULT_GRID_GAP,
  minCardHeight = DEFAULT_MIN_CARD_HEIGHT,
) {
  const safeRows = Math.max(1, Math.floor(rows));
  const percentage = formatCssNumber(100 / safeRows);
  const gapShare = formatCssNumber(
    (gap * Math.max(0, safeRows - 1)) / safeRows,
  );

  return `min(100%, max(${minCardHeight}px, calc(${percentage}% - ${gapShare}px)))`;
}
