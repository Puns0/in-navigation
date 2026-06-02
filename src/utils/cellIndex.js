/**
 * Cell Index — spatial lookup from grid coordinates to room IDs.
 *
 * Instead of storing a full 100x100 grid array, we use a Map keyed by "row,col"
 * strings. This is memory-efficient for sparse maps and gives O(1) lookups.
 *
 * The index is rebuilt whenever rooms change (relatively infrequent compared
 * to render frames).
 */

/**
 * Build a cell→roomId lookup map from a rooms array.
 * @param {Array} rooms - Array of room objects with .id and .geometry[{row,col}]
 * @returns {Map<string, string>} - Map from "row,col" to room ID
 */
export function buildCellIndex(rooms) {
  const index = new Map()
  for (const room of rooms) {
    for (const { row, col } of room.geometry) {
      index.set(`${row},${col}`, room.id)
    }
  }
  return index
}

/**
 * Look up which room owns a given cell.
 * @param {Map} cellIndex
 * @param {number} row
 * @param {number} col
 * @returns {string|null} room ID or null
 */
export function getRoomAtCell(cellIndex, row, col) {
  return cellIndex.get(`${row},${col}`) || null
}

/**
 * Build a cell→room type lookup map for fast rendering.
 * @param {Array} rooms
 * @returns {Map<string, string>} - Map from "row,col" to room type
 */
export function buildTypeIndex(rooms) {
  const index = new Map()
  for (const room of rooms) {
    for (const { row, col } of room.geometry) {
      index.set(`${row},${col}`, room.type)
    }
  }
  return index
}
