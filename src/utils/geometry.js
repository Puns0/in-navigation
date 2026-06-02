/**
 * Grid geometry utilities.
 * All coordinate operations used by the editor live here.
 */

/**
 * Bresenham-style line interpolation between two grid cells.
 * Returns an array of {row, col} covering every cell along the path.
 * Guarantees no gaps even during fast mouse movement.
 */
export function interpolateCells(r0, c0, r1, c1) {
  const cells = []
  const dr = Math.abs(r1 - r0)
  const dc = Math.abs(c1 - c0)
  const steps = Math.max(dr, dc, 1)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const r = Math.round(r0 + (r1 - r0) * t)
    const c = Math.round(c0 + (c1 - c0) * t)
    cells.push({ row: r, col: c })
  }
  return cells
}

/**
 * Returns all {row, col} cells inside a rectangle defined by two corners.
 * Corners can be in any order.
 */
export function cellsInRect(r0, c0, r1, c1) {
  const minR = Math.min(r0, r1)
  const maxR = Math.max(r0, r1)
  const minC = Math.min(c0, c1)
  const maxC = Math.max(c0, c1)
  const cells = []
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      cells.push({ row: r, col: c })
    }
  }
  return cells
}

/**
 * Compute axis-aligned bounding box of a cell array.
 */
export function computeBounds(cells) {
  if (!cells.length) return null
  let minRow = Infinity, maxRow = -Infinity
  let minCol = Infinity, maxCol = -Infinity
  for (const { row, col } of cells) {
    if (row < minRow) minRow = row
    if (row > maxRow) maxRow = row
    if (col < minCol) minCol = col
    if (col > maxCol) maxCol = col
  }
  return { minRow, maxRow, minCol, maxCol }
}

/**
 * Compute center point (float) of a cell array.
 */
export function computeCenter(cells) {
  if (!cells.length) return null
  const bounds = computeBounds(cells)
  return {
    row: (bounds.minRow + bounds.maxRow + 1) / 2,
    col: (bounds.minCol + bounds.maxCol + 1) / 2,
  }
}

/**
 * Convert screen pixel coordinates to grid cell coordinates.
 * Returns { col, row, sx, sy } where sx/sy are the continuous grid coords.
 */
export function screenToGrid(clientX, clientY, pan, zoom, tileSize, containerRect) {
  const sx = (clientX - containerRect.left - pan.x) / (tileSize * zoom)
  const sy = (clientY - containerRect.top - pan.y) / (tileSize * zoom)
  return {
    col: Math.floor(sx),
    row: Math.floor(sy),
    sx,
    sy,
  }
}

/** Clamp a value between min and max */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Draws text with word wrapping.
 */
export function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, fillPrimary, fillShadow) {
  if (!text) return
  const words = text.split(' ')
  const lines = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const width = ctx.measureText(currentLine + " " + word).width
    if (width < maxWidth) {
      currentLine += " " + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)

  const totalHeight = lines.length * lineHeight
  let currentY = y - (totalHeight / 2) + (lineHeight / 2)

  for (const line of lines) {
    if (fillShadow) {
      ctx.fillStyle = fillShadow
      ctx.fillText(line, x + 1, currentY + 1, maxWidth)
    }
    ctx.fillStyle = fillPrimary
    ctx.fillText(line, x, currentY, maxWidth)
    currentY += lineHeight
  }
}
