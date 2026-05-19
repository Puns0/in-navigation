import { create } from 'zustand'

const COLS = 100
const ROWS = 100

const makeEmptyGrid = () =>
  Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      row: r,
      col: c,
      type: 'empty',
    }))
  )

const makeFloor = (id) => ({
  id,
  label: getFloorLabel(id),
  grid: makeEmptyGrid(),
  walls: {},
  nodes: [],
  edges: [],
  tileGroups: [],
})

export const getFloorLabel = (id) => {
  if (id === 0) return 'Ground'
  if (id > 0) return `Floor ${id}`
  return `Basement ${Math.abs(id)}`
}

const findTileGroups = (grid) => {
  const visited = new Set()
  const groups = []
  const getKey = (r, c) => `${r},${c}`
  const neighbors = (r, c) => [
    [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
  ]

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      const cell = grid[r][c]
      if (cell.type === 'empty') continue
      const key = getKey(r, c)
      if (visited.has(key)) continue

      const group = []
      const queue = [[r, c]]
      visited.add(key)

      while (queue.length) {
        const [cr, cc] = queue.shift()
        group.push({ row: cr, col: cc })
        for (const [nr, nc] of neighbors(cr, cc)) {
          const nkey = getKey(nr, nc)
          if (
            nr >= 0 && nr < grid.length &&
            nc >= 0 && nc < grid[0].length &&
            grid[nr][nc].type === cell.type &&
            !visited.has(nkey)
          ) {
            visited.add(nkey)
            queue.push([nr, nc])
          }
        }
      }

      const minRow = Math.min(...group.map(t => t.row))
      const maxRow = Math.max(...group.map(t => t.row))
      const minCol = Math.min(...group.map(t => t.col))
      const maxCol = Math.max(...group.map(t => t.col))
      const id = `${cell.type}_${getKey(minRow, minCol)}`

      groups.push({
        id,
        type: cell.type,
        tiles: group,
        minRow, maxRow, minCol, maxCol,
        label: null,
      })
    }
  }

  return groups
}

const MAX_HISTORY = 50

const cloneFloors = (floors) => JSON.parse(JSON.stringify(floors))

export const useMapStore = create((set, get) => ({
  floors: [makeFloor(0)],
  activeFloorId: 0,
  activeTool: 'paint',
  activeTileType: 'room',
  selectedNodeId: null,
  history: [],
  future: [],

  // ── Undo / Redo ─────────────────────────────────────────
  _pushHistory: () => {
    const { floors, history } = get()
    set({
      history: [...history.slice(-MAX_HISTORY + 1), cloneFloors(floors)],
      future: [],
    })
  },

  undo: () => {
    const { history, floors, future } = get()
    if (!history.length) return
    set({
      floors: history[history.length - 1],
      history: history.slice(0, -1),
      future: [cloneFloors(floors), ...future.slice(0, MAX_HISTORY - 1)],
    })
  },

  redo: () => {
    const { future, floors, history } = get()
    if (!future.length) return
    set({
      floors: future[0],
      future: future.slice(1),
      history: [...history.slice(-MAX_HISTORY + 1), cloneFloors(floors)],
    })
  },

  // ── Getters ─────────────────────────────────────────────
  getActiveFloor: () => {
    const { floors, activeFloorId } = get()
    return floors.find(f => f.id === activeFloorId)
  },

  // ── Tools ───────────────────────────────────────────────
  setActiveTool: (tool) => set({ activeTool: tool, selectedNodeId: null }),
  setActiveTileType: (type) => set({ activeTileType: type }),
  setActiveFloor: (id) => set({ activeFloorId: id, selectedNodeId: null }),

  // ── Paint ───────────────────────────────────────────────
  paintTile: (row, col) => {
    const { floors, activeFloorId, activeTool, activeTileType, _pushHistory } = get()
    _pushHistory()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        const newGrid = floor.grid.map(r => r.map(cell => {
          if (cell.row === row && cell.col === col) {
            return { ...cell, type: activeTool === 'erase' ? 'empty' : activeTileType }
          }
          return cell
        }))
        // Preserve existing labels when regrouping
        const oldGroups = floor.tileGroups
        const newGroups = findTileGroups(newGrid).map(newGroup => {
          // Try to find a matching old group by overlapping tiles
          const match = oldGroups.find(og =>
            og.type === newGroup.type &&
            og.tiles.some(t =>
              newGroup.tiles.some(nt => nt.row === t.row && nt.col === t.col)
            )
          )
          return match?.label ? { ...newGroup, label: match.label } : newGroup
        })
        return { ...floor, grid: newGrid, tileGroups: newGroups }
      })
    })
  },

  // ── Group label ─────────────────────────────────────────
  setGroupLabel: (groupId, labelData) => {
    const { floors, activeFloorId, _pushHistory } = get()
    _pushHistory()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        return {
          ...floor,
          tileGroups: floor.tileGroups.map(g =>
            g.id === groupId ? { ...g, label: labelData } : g
          ),
        }
      })
    })
  },

  // Find which group a tile belongs to
  getGroupAtTile: (row, col) => {
    const { floors, activeFloorId } = get()
    const floor = floors.find(f => f.id === activeFloorId)
    if (!floor) return null
    return floor.tileGroups.find(g =>
      g.tiles.some(t => t.row === row && t.col === col)
    ) || null
  },

  // ── Walls ───────────────────────────────────────────────
  toggleWall: (row, col, direction, forceRemove = false) => {
    const { floors, activeFloorId, _pushHistory } = get()
    const key = `${row},${col},${direction}`
    _pushHistory()
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
      })
    })
  },

  // ── Nodes ───────────────────────────────────────────────
  placeNode: (row, col) => {
    const { floors, activeFloorId, _pushHistory } = get()
    const floor = floors.find(f => f.id === activeFloorId)
    if (!floor) return
    if (floor.nodes.find(n => n.row === row && n.col === col)) return
    _pushHistory()
    const newNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      row, col,
    }
    set({
      floors: floors.map(f => {
        if (f.id !== activeFloorId) return f
        return { ...f, nodes: [...f.nodes, newNode] }
      })
    })
  },

  removeNode: (nodeId) => {
    const { floors, activeFloorId, _pushHistory } = get()
    _pushHistory()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        return {
          ...floor,
          nodes: floor.nodes.filter(n => n.id !== nodeId),
          edges: floor.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
        }
      })
    })
  },

  // ── Edges ───────────────────────────────────────────────
  connectNodes: (fromId, toId) => {
    const { floors, activeFloorId, _pushHistory } = get()
    if (fromId === toId) return
    const floor = floors.find(f => f.id === activeFloorId)
    if (!floor) return
    const exists = floor.edges.find(
      e => (e.from === fromId && e.to === toId) ||
           (e.from === toId && e.to === fromId)
    )
    if (exists) return
    _pushHistory()
    set({
      floors: floors.map(f => {
        if (f.id !== activeFloorId) return f
        return {
          ...f,
          edges: [...f.edges, {
            id: `edge_${Date.now()}`,
            from: fromId,
            to: toId,
          }],
        }
      })
    })
  },

  removeEdge: (edgeId) => {
    const { floors, activeFloorId, _pushHistory } = get()
    _pushHistory()
    set({
      floors: floors.map(floor => {
        if (floor.id !== activeFloorId) return floor
        return { ...floor, edges: floor.edges.filter(e => e.id !== edgeId) }
      })
    })
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  // ── Staircases ──────────────────────────────────────────
  navigateStaircase: (row, col, direction) => {
    const { floors, activeFloorId } = get()
    const sorted = [...floors].sort((a, b) => a.id - b.id)
    const currentFloor = floors.find(f => f.id === activeFloorId)
    const currentIndex = sorted.findIndex(f => f.id === activeFloorId)

    const migrate = (newFloor) => {
      const group = currentFloor.tileGroups.find(g =>
        g.type === 'staircase' &&
        g.tiles.some(t => t.row === row && t.col === col)
      )
      const tilesToCopy = group ? group.tiles : [{ row, col }]
      tilesToCopy.forEach(({ row: r, col: c }) => {
        newFloor.grid[r][c].type = 'staircase'
      })
      newFloor.tileGroups = findTileGroups(newFloor.grid)
      return newFloor
    }

    if (direction === 'up') {
      const next = sorted[currentIndex + 1]
      if (next) {
        set({ activeFloorId: next.id })
      } else {
        const newId = currentFloor.id + 1
        const newFloor = migrate(makeFloor(newId))
        set({
          floors: [...floors, newFloor].sort((a, b) => a.id - b.id),
          activeFloorId: newId,
        })
      }
    } else {
      const prev = sorted[currentIndex - 1]
      if (prev) {
        set({ activeFloorId: prev.id })
      } else {
        const newId = currentFloor.id - 1
        const newFloor = migrate(makeFloor(newId))
        set({
          floors: [...floors, newFloor].sort((a, b) => a.id - b.id),
          activeFloorId: newId,
        })
      }
    }
  },

  // ── Save / Load ─────────────────────────────────────────
  saveToLocalStorage: () => {
    const { floors } = get()
    localStorage.setItem('indoor_nav_map', JSON.stringify(floors))
  },

  loadFromLocalStorage: () => {
    const raw = localStorage.getItem('indoor_nav_map')
    if (!raw) return false
    try {
      const floors = JSON.parse(raw)
      set({ floors, activeFloorId: floors[0]?.id ?? 0, history: [], future: [] })
      return true
    } catch {
      return false
    }
  },

  exportJSON: () => {
    const { floors } = get()
    const blob = new Blob([JSON.stringify(floors, null, 2)], { type: 'application/json' })
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
        const floors = JSON.parse(e.target.result)
        set({ floors, activeFloorId: floors[0]?.id ?? 0, history: [], future: [] })
      } catch {
        alert('Invalid map file.')
      }
    }
    reader.readAsText(file)
  },
}))