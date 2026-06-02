import { create } from 'zustand'
import { generateId } from '../utils/id'
import { buildCellIndex } from '../utils/cellIndex'

// ── Constants ──────────────────────────────────────────────────────────────
const COLS = 100
const ROWS = 100
const MAX_HISTORY = 50

export { COLS, ROWS }

// ── Floor factory ──────────────────────────────────────────────────────────
export function getFloorLabel(id) {
  if (id === 0) return 'Ground'
  if (id > 0) return `Floor ${id}`
  return `Basement ${Math.abs(id)}`
}

function makeFloor(id) {
  return {
    id,
    label: getFloorLabel(id),
    rooms: [],
    walls: {},
    nodes: [],
    edges: [],
    markers: [],
  }
}

// ── Deep clone helper ──────────────────────────────────────────────────────
const cloneFloors = (floors) => JSON.parse(JSON.stringify(floors))

// ── Store ──────────────────────────────────────────────────────────────────
export const useMapStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  floors: [makeFloor(0)],
  activeFloorId: 0,
  activeTool: 'paint',
  activeRoomType: 'room',
  activeNodeType: 'hallway',
  activeMarkerType: 'info',
  selectedNodeId: null,
  selectedRoomId: null,
  selectedMarkerId: null,
  events: [],

  // Stroke-in-progress: cells being painted before mouseUp finalizes the room
  pendingStroke: null, // { type, cells: [{row,col}] } or null

  // Marquee selection
  marqueeSelection: null, // { startRow, startCol, endRow, endCol } or null

  // History (stroke-level)
  history: [],
  future: [],

  // Cell index cache — rebuilt when rooms change
  _cellIndex: new Map(),
  _cellIndexFloorId: null,

  // ── Cell index ───────────────────────────────────────────────────────────
  getCellIndex: () => {
    const { floors, activeFloorId, _cellIndex, _cellIndexFloorId } = get()
    const floor = floors.find(f => f.id === activeFloorId)
    if (!floor) return new Map()
    // Rebuild if stale
    if (_cellIndexFloorId !== activeFloorId || _cellIndex._roomCount !== floor.rooms.length) {
      const idx = buildCellIndex(floor.rooms)
      idx._roomCount = floor.rooms.length
      set({ _cellIndex: idx, _cellIndexFloorId: activeFloorId })
      return idx
    }
    return _cellIndex
  },

  rebuildCellIndex: () => {
    const { floors, activeFloorId } = get()
    const floor = floors.find(f => f.id === activeFloorId)
    if (!floor) return
    const idx = buildCellIndex(floor.rooms)
    idx._roomCount = floor.rooms.length
    set({ _cellIndex: idx, _cellIndexFloorId: activeFloorId })
  },

  // ── Undo / Redo (stroke-level) ──────────────────────────────────────────
  beginStroke: () => {
    const { floors, history } = get()
    set({
      history: [...history.slice(-(MAX_HISTORY - 1)), cloneFloors(floors)],
      future: [],
    })
  },

  undo: () => {
    const { history, floors, future } = get()
    if (!history.length) return
    const prev = history[history.length - 1]
    set({
      floors: prev,
      history: history.slice(0, -1),
      future: [cloneFloors(floors), ...future.slice(0, MAX_HISTORY - 1)],
      pendingStroke: null,
    })
    get().rebuildCellIndex()
  },

  redo: () => {
    const { future, floors, history } = get()
    if (!future.length) return
    const next = future[0]
    set({
      floors: next,
      future: future.slice(1),
      history: [...history.slice(-(MAX_HISTORY - 1)), cloneFloors(floors)],
      pendingStroke: null,
    })
    get().rebuildCellIndex()
  },

  // ── Getters ──────────────────────────────────────────────────────────────
  getActiveFloor: () => {
    const { floors, activeFloorId } = get()
    return floors.find(f => f.id === activeFloorId) || null
  },

  getRoomById: (roomId) => {
    const floor = get().getActiveFloor()
    if (!floor) return null
    return floor.rooms.find(r => r.id === roomId) || null
  },

  getRoomAtCell: (row, col) => {
    const cellIndex = get().getCellIndex()
    const roomId = cellIndex.get(`${row},${col}`)
    if (!roomId) return null
    return get().getRoomById(roomId)
  },

  // ── Tool setters ─────────────────────────────────────────────────────────
  setActiveTool: (tool) => set({
    activeTool: tool,
    selectedNodeId: null,
    selectedRoomId: null,
    selectedMarkerId: null,
    pendingStroke: null,
    marqueeSelection: null,
  }),

  setActiveRoomType: (type) => set({ activeRoomType: type }),
  setActiveNodeType: (type) => set({ activeNodeType: type }),
  setActiveMarkerType: (type) => set({ activeMarkerType: type }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setSelectedRoom: (id) => set({ selectedRoomId: id }),
  setSelectedMarker: (id) => set({ selectedMarkerId: id }),

  // ── Floor management ─────────────────────────────────────────────────────
  setActiveFloor: (id) => set({
    activeFloorId: id,
    selectedNodeId: null,
    selectedRoomId: null,
    selectedMarkerId: null,
    pendingStroke: null,
    marqueeSelection: null,
  }),

  addFloor: (direction) => {
    const { floors } = get()
    const sorted = [...floors].sort((a, b) => a.id - b.id)
    let newId
    if (direction === 'up') {
      newId = sorted.length ? sorted[sorted.length - 1].id + 1 : 1
    } else {
      newId = sorted.length ? sorted[0].id - 1 : -1
    }
    const newFloor = makeFloor(newId)
    set({
      floors: [...floors, newFloor].sort((a, b) => a.id - b.id),
      activeFloorId: newId,
    })
  },

  removeFloor: (floorId) => {
    const { floors, activeFloorId } = get()
    if (floors.length <= 1) return // must keep at least one floor
    const remaining = floors.filter(f => f.id !== floorId)
    const newActive = activeFloorId === floorId
      ? remaining[0].id
      : activeFloorId
    set({ floors: remaining, activeFloorId: newActive })
  },

  // ── Staircase navigation ─────────────────────────────────────────────────
  navigateStaircase: (roomId, direction) => {
    const { floors, activeFloorId } = get()
    const currentFloor = floors.find(f => f.id === activeFloorId)
    if (!currentFloor) return

    const staircaseRoom = currentFloor.rooms.find(r => r.id === roomId)
    if (!staircaseRoom || staircaseRoom.type !== 'staircase') return

    const sorted = [...floors].sort((a, b) => a.id - b.id)
    const currentIndex = sorted.findIndex(f => f.id === activeFloorId)

    let targetFloor
    let updatedFloors = [...floors]

    if (direction === 'up') {
      const next = sorted[currentIndex + 1]
      if (next) {
        targetFloor = next
      } else {
        // Create a new floor above
        const newId = currentFloor.id + 1
        targetFloor = makeFloor(newId)
        updatedFloors = [...updatedFloors, targetFloor].sort((a, b) => a.id - b.id)
      }
    } else {
      const prev = sorted[currentIndex - 1]
      if (prev) {
        targetFloor = prev
      } else {
        // Create a new floor below (basement)
        const newId = currentFloor.id - 1
        targetFloor = makeFloor(newId)
        updatedFloors = [...updatedFloors, targetFloor].sort((a, b) => a.id - b.id)
      }
    }

    // Copy staircase geometry to target floor if no staircase already exists there
    const cellSet = new Set(staircaseRoom.geometry.map(c => `${c.row},${c.col}`))
    const existingStaircase = targetFloor.rooms.find(r =>
      r.type === 'staircase' &&
      r.geometry.some(c => cellSet.has(`${c.row},${c.col}`))
    )

    if (!existingStaircase) {
      const newRoom = {
        id: generateId('room'),
        floorId: targetFloor.id,
        name: staircaseRoom.name,
        number: staircaseRoom.number,
        type: 'staircase',
        geometry: [...staircaseRoom.geometry.map(c => ({ ...c }))],
        labelAnchor: null,
        entryPoint: null,
        metadata: {},
      }
      updatedFloors = updatedFloors.map(f => {
        if (f.id !== targetFloor.id) return f
        return { ...f, rooms: [...f.rooms, newRoom] }
      })
    }

    set({
      floors: updatedFloors,
      activeFloorId: targetFloor.id,
    })
    get().rebuildCellIndex()
  },

  // ── Paint stroke lifecycle ───────────────────────────────────────────────
  startPaintStroke: (type) => {
    set({ pendingStroke: { type, cells: [] } })
  },

  addPendingCells: (newCells) => {
    const { pendingStroke } = get()
    if (!pendingStroke) return

    // Deduplicate: only add cells not already in pending
    const existing = new Set(pendingStroke.cells.map(c => `${c.row},${c.col}`))
    const unique = newCells.filter(c => {
      const key = `${c.row},${c.col}`
      if (existing.has(key)) return false
      existing.add(key)
      return true
    })

    if (unique.length === 0) return

    set({
      pendingStroke: {
        ...pendingStroke,
        cells: [...pendingStroke.cells, ...unique],
      },
    })
  },

  finalizePaintStroke: () => {
    const { pendingStroke, floors, activeFloorId } = get()
    if (!pendingStroke || pendingStroke.cells.length === 0) {
      set({ pendingStroke: null })
      return
    }

    const roomId = generateId('room')
    const newRoom = {
      id: roomId,
      floorId: activeFloorId,
      name: '',
      number: '',
      type: pendingStroke.type,
      geometry: [...pendingStroke.cells],
      labelAnchor: null,
      entryPoint: null,
      metadata: {},
    }

    // Remove painted cells from any existing rooms
    const cellSet = new Set(pendingStroke.cells.map(c => `${c.row},${c.col}`))

    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        // Strip cells from existing rooms
        const updatedRooms = floor.rooms
          .map(room => ({
            ...room,
            geometry: room.geometry.filter(c => !cellSet.has(`${c.row},${c.col}`)),
          }))
          .filter(room => room.geometry.length > 0) // Remove empty rooms
        return {
          ...floor,
          rooms: [...updatedRooms, newRoom],
        }
      }),
      pendingStroke: null,
    })
    get().rebuildCellIndex()
  },

  // ── Erase ────────────────────────────────────────────────────────────────
  eraseCells: (cells) => {
    const { floors, activeFloorId } = get()
    const cellSet = new Set(cells.map(c => `${c.row},${c.col}`))

    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        const updatedRooms = floor.rooms
          .map(room => ({
            ...room,
            geometry: room.geometry.filter(c => !cellSet.has(`${c.row},${c.col}`)),
          }))
          .filter(room => room.geometry.length > 0)
        return { ...floor, rooms: updatedRooms }
      }),
    })
    get().rebuildCellIndex()
  },

  // ── Room CRUD ────────────────────────────────────────────────────────────
  updateRoom: (roomId, patch) => {
    const { floors, activeFloorId } = get()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        return {
          ...floor,
          rooms: floor.rooms.map(room =>
            room.id === roomId ? { ...room, ...patch } : room
          ),
        }
      }),
    })
  },

  deleteRoom: (roomId) => {
    const { floors, activeFloorId } = get()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        return {
          ...floor,
          rooms: floor.rooms.filter(r => r.id !== roomId),
        }
      }),
      selectedRoomId: null,
    })
    get().rebuildCellIndex()
  },

  // ── Walls ────────────────────────────────────────────────────────────────
  toggleWall: (row, col, direction, forceRemove = false) => {
    const { floors, activeFloorId } = get()
    const key = `${row},${col},${direction}`
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        const newWalls = { ...floor.walls }
        if (forceRemove || newWalls[key]) {
          delete newWalls[key]
        } else {
          newWalls[key] = true
        }
        return { ...floor, walls: newWalls }
      }),
    })
  },

  // ── Navigation Nodes ─────────────────────────────────────────────────────
  placeNode: (row, col, type) => {
    const { floors, activeFloorId } = get()
    const floor = floors.find(f => f.id === activeFloorId)
    if (!floor) return
    // Prevent duplicate at same cell
    if (floor.nodes.find(n => n.row === row && n.col === col)) return

    const newNode = {
      id: generateId('node'),
      row,
      col,
      type: type || get().activeNodeType,
      label: null,
      roomId: null,
    }
    set({
      floors: floors.map(f => {
        if (f.id !== activeFloorId) return f
        return { ...f, nodes: [...f.nodes, newNode] }
      }),
    })
  },

  removeNode: (nodeId) => {
    const { floors, activeFloorId } = get()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        return {
          ...floor,
          nodes: floor.nodes.filter(n => n.id !== nodeId),
          edges: floor.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
        }
      }),
    })
  },

  updateNode: (nodeId, patch) => {
    const { floors, activeFloorId } = get()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        return {
          ...floor,
          nodes: floor.nodes.map(n => n.id === nodeId ? { ...n, ...patch } : n),
        }
      }),
    })
  },

  // ── Navigation Edges ─────────────────────────────────────────────────────
  connectNodes: (fromId, toId) => {
    if (fromId === toId) return
    const { floors, activeFloorId } = get()
    const floor = floors.find(f => f.id === activeFloorId)
    if (!floor) return
    // Prevent duplicate edges
    const exists = floor.edges.find(
      e => (e.from === fromId && e.to === toId) ||
           (e.from === toId && e.to === fromId)
    )
    if (exists) return

    set({
      floors: floors.map(f => {
        if (f.id !== activeFloorId) return f
        return {
          ...f,
          edges: [...f.edges, {
            id: generateId('edge'),
            from: fromId,
            to: toId,
            weight: null,
          }],
        }
      }),
    })
  },

  removeEdge: (edgeId) => {
    const { floors, activeFloorId } = get()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        return { ...floor, edges: floor.edges.filter(e => e.id !== edgeId) }
      }),
    })
  },

  // ── Markers ──────────────────────────────────────────────────────────────
  placeMarker: (row, col, type) => {
    const { floors, activeFloorId } = get()
    const floor = floors.find(f => f.id === activeFloorId)
    if (!floor) return
    // Prevent duplicate at same cell
    if (floor.markers.find(m => m.row === row && m.col === col)) return

    const newMarker = {
      id: generateId('marker'),
      row,
      col,
      type: type || get().activeMarkerType,
      label: null,
      targetFloorId: null,
    }
    set({
      floors: floors.map(f => {
        if (f.id !== activeFloorId) return f
        return { ...f, markers: [...f.markers, newMarker] }
      }),
    })
  },

  removeMarker: (markerId) => {
    const { floors, activeFloorId } = get()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        return { ...floor, markers: floor.markers.filter(m => m.id !== markerId) }
      }),
    })
  },

  updateMarker: (markerId, patch) => {
    const { floors, activeFloorId } = get()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        return {
          ...floor,
          markers: floor.markers.map(m => m.id === markerId ? { ...m, ...patch } : m),
        }
      }),
    })
  },

  // ── Marquee ──────────────────────────────────────────────────────────────
  setMarqueeSelection: (sel) => set({ marqueeSelection: sel }),

  // ── Events ───────────────────────────────────────────────────────────────
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateEvent: (id, updates) => set((state) => ({
    events: state.events.map(e => e.id === id ? { ...e, ...updates } : e)
  })),
  deleteEvent: (id) => set((state) => ({
    events: state.events.filter(e => e.id !== id)
  })),

  // ── Save / Load ──────────────────────────────────────────────────────────
  saveToLocalStorage: () => {
    const { floors, events } = get()
    localStorage.setItem('indoor_nav_map_v2', JSON.stringify({ floors, events }))
  },

  loadFromLocalStorage: () => {
    const raw = localStorage.getItem('indoor_nav_map_v2')
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw)
      const isLegacy = Array.isArray(parsed)
      const floors = isLegacy ? parsed : parsed.floors
      const events = isLegacy ? [] : (parsed.events || [])
      
      set({ floors, events, activeFloorId: floors[0]?.id ?? 0, history: [], future: [] })
      get().rebuildCellIndex()
      return true
    } catch {
      return false
    }
  },

  exportJSON: () => {
    const { floors, events } = get()
    const blob = new Blob([JSON.stringify({ floors, events }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'indoor_nav_map.json'
    a.click()
    URL.revokeObjectURL(url)
  },

  importJSON: (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        const isLegacy = Array.isArray(parsed)
        const floors = isLegacy ? parsed : parsed.floors
        const events = isLegacy ? [] : (parsed.events || [])

        set({ floors, events, activeFloorId: floors[0]?.id ?? 0, history: [], future: [] })
        get().rebuildCellIndex()
      } catch {
        alert('Invalid map file.')
      }
    }
    reader.readAsText(file)
  },
}))

// ── Auto-save ──────────────────────────────────────────────────────────────
let saveTimeout = null
useMapStore.subscribe((state, prevState) => {
  if (state.floors !== prevState.floors || state.events !== prevState.events) {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      localStorage.setItem('indoor_nav_map_v2', JSON.stringify({ floors: state.floors, events: state.events }))
    }, 2000)
  }
})