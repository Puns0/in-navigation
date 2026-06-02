/**
 * Editor tool definitions.
 * Each tool has an icon, label, optional keyboard shortcut, and cursor style.
 */
export const TOOLS = {
  pan:     { id: 'pan',     icon: '✋', label: 'Pan',         shortcut: 'H', cursor: 'grab' },
  paint:   { id: 'paint',   icon: '🖌', label: 'Paint',       shortcut: 'B', cursor: 'crosshair' },
  erase:   { id: 'erase',   icon: '🧹', label: 'Erase',       shortcut: 'E', cursor: 'crosshair' },
  wall:    { id: 'wall',    icon: '🧱', label: 'Wall',        shortcut: 'W', cursor: 'crosshair' },
  marquee: { id: 'marquee', icon: '⬜', label: 'Marquee',     shortcut: 'M', cursor: 'crosshair' },
  label:   { id: 'label',   icon: '🏷', label: 'Label',       shortcut: 'L', cursor: 'pointer' },
  node:    { id: 'node',    icon: '⬤',  label: 'Place Node',  shortcut: 'N', cursor: 'crosshair' },
  edge:    { id: 'edge',    icon: '↔',  label: 'Draw Edge',   shortcut: 'G', cursor: 'crosshair' },
  marker:  { id: 'marker',  icon: '📍', label: 'Marker',      shortcut: 'K', cursor: 'crosshair' },
}

export const DEFAULT_TOOL = 'paint'
