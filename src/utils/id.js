/**
 * Stable ID generation for all entities.
 * Uses crypto.randomUUID() with a prefix for readability and debugging.
 */
export function generateId(prefix = 'id') {
  const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  return `${prefix}_${uuid}`
}
