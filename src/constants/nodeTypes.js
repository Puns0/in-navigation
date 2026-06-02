/**
 * Navigation node type definitions.
 * Nodes form the pathfinding graph overlaid on the map.
 * Each type has a visual color and icon for the editor.
 */
export const NODE_TYPES = {
  hallway:      { id: 'hallway',      label: 'Hallway',      color: '#8b5cf6', icon: '●' },
  entrance:     { id: 'entrance',     label: 'Entrance',     color: '#10b981', icon: '◆' },
  staircase:    { id: 'staircase',    label: 'Staircase',    color: '#f59e0b', icon: '▲' },
  intersection: { id: 'intersection', label: 'Intersection', color: '#ef4444', icon: '✦' },
  room_entry:   { id: 'room_entry',   label: 'Room Entry',   color: '#3b82f6', icon: '◈' },
}

export const DEFAULT_NODE_TYPE = 'hallway'
