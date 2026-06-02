/**
 * Marker type definitions.
 * Markers are placed on the map to denote points of interest,
 * floor transitions, exits, etc.
 */
export const MARKER_TYPES = {
  info:       { id: 'info',       label: 'Info',       icon: 'ℹ',  color: '#3b82f6' },
  stair_up:   { id: 'stair_up',   label: 'Stair Up',   icon: '⬆',  color: '#10b981' },
  stair_down: { id: 'stair_down', label: 'Stair Down', icon: '⬇',  color: '#f59e0b' },
  exit:       { id: 'exit',       label: 'Exit',       icon: '🚪', color: '#ef4444' },
  entrance:   { id: 'entrance',   label: 'Entrance',   icon: '🚶', color: '#8b5cf6' },
  center:     { id: 'center',     label: 'Map Center', icon: '🎯', color: '#ec4899' },
  custom:     { id: 'custom',     label: 'Custom',     icon: '📌', color: '#6b7280' },
}

export const DEFAULT_MARKER_TYPE = 'info'
