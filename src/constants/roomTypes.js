/**
 * Room type definitions.
 * Each type has a unique id, display label, fill color, and semantic category.
 * Category is used for future filtering / grouping in dashboards.
 */
export const ROOM_TYPES = {
  room:         { id: 'room',         label: 'Room',           color: '#93c5fd', category: 'indoor' },
  corridor:     { id: 'corridor',     label: 'Corridor',       color: '#a1a1aa', category: 'indoor' },
  staircase:    { id: 'staircase',    label: 'Staircase',      color: '#86efac', category: 'indoor' },
  toilet:       { id: 'toilet',       label: 'Toilet',         color: '#67e8f9', category: 'indoor' },
  construction: { id: 'construction', label: 'Construction',   color: '#fca5a5', category: 'utility' },
  garden:       { id: 'garden',       label: 'Garden',         color: '#4ade80', category: 'outdoor' },
  road:         { id: 'road',         label: 'Road',           color: '#9ca3af', category: 'outdoor' },
  footpath:     { id: 'footpath',     label: 'Footpath',       color: '#fde68a', category: 'outdoor' },
  parking:      { id: 'parking',      label: 'Parking',        color: '#fbbf24', category: 'outdoor' },
  sports:       { id: 'sports',       label: 'Sports Ground',  color: '#a3e635', category: 'outdoor' },
  center:       { id: 'center',       label: 'Center',         color: '#f0abfc', category: 'special' },
}

/** Default type for new paint strokes */
export const DEFAULT_ROOM_TYPE = 'room'
