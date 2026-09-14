const DEFAULT_GRID_GAP = 2;
const DEFAULT_MIN_CARD_WIDTH = 220;

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
