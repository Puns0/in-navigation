import { useRef, useEffect, useState, useCallback } from 'react'
import { useMapStore, COLS, ROWS } from '../../store/useMapStore'
import { useShallow } from 'zustand/react/shallow'
import { ROOM_TYPES } from '../../constants/roomTypes'
import { NODE_TYPES } from '../../constants/nodeTypes'
import { MARKER_TYPES } from '../../constants/markerTypes'
import { TOOLS } from '../../constants/tools'
import { interpolateCells, screenToGrid, clamp } from '../../utils/geometry'
import { buildTypeIndex } from '../../utils/cellIndex'
import RoomPropertiesPopup from './RoomPropertiesPopup'
import NodePropertiesPopup from './NodePropertiesPopup'

const TILE_SIZE = 24
const WALL_THICKNESS = 3
const NODE_RADIUS = 7
const MIN_ZOOM = 0.15
const MAX_ZOOM = 3

export default function Viewport() {

  const {
    getActiveFloor, activeTool,
    activeRoomType, activeNodeType, activeMarkerType,
    beginStroke, startPaintStroke, addPendingCells, finalizePaintStroke,
    eraseCells, toggleWall,
    placeNode, removeNode, connectNodes, removeEdge,
    placeMarker, removeMarker,
    selectedNodeId, setSelectedNode,
    pendingStroke, marqueeSelection, setMarqueeSelection,
    setActiveTool, navigateStaircase,
  } = useMapStore(useShallow(state => ({
    getActiveFloor: state.getActiveFloor,
    activeTool: state.activeTool,
    activeRoomType: state.activeRoomType,
    activeNodeType: state.activeNodeType,
    activeMarkerType: state.activeMarkerType,
    beginStroke: state.beginStroke,
    startPaintStroke: state.startPaintStroke,
    addPendingCells: state.addPendingCells,
    finalizePaintStroke: state.finalizePaintStroke,
    eraseCells: state.eraseCells,
    toggleWall: state.toggleWall,
    placeNode: state.placeNode,
    removeNode: state.removeNode,
    connectNodes: state.connectNodes,
    removeEdge: state.removeEdge,
    placeMarker: state.placeMarker,
    removeMarker: state.removeMarker,
    selectedNodeId: state.selectedNodeId,
    setSelectedNode: state.setSelectedNode,
    pendingStroke: state.pendingStroke,
    marqueeSelection: state.marqueeSelection,
    setMarqueeSelection: state.setMarqueeSelection,
    setActiveTool: state.setActiveTool,
    navigateStaircase: state.navigateStaircase,
  })))
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  // Pan / zoom state (refs for perf, state for SVG re-render)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 40, y: 40 })
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 40, y: 40 })

  // Interaction refs
  const isPanning = useRef(false)
  const panStart = useRef(null)
  const spaceHeld = useRef(false)
  const [spaceHeldState, setSpaceHeldState] = useState(false)

  const isPainting = useRef(false)
  const isErasing = useRef(false)
  const isDrawingWall = useRef(false)
  const isMarquee = useRef(false)
  const marqueeStart = useRef(null)
  const lastPaintCell = useRef(null)
  const lastWallRef = useRef(null)
  const lastMousePos = useRef(null)
  const erasedCells = useRef([])

  // Popup state
  const [labelPopup, setLabelPopup] = useState(null)
  const [nodeLabelPopup, setNodeLabelPopup] = useState(null)

  // Sync refs
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panRef.current = pan }, [pan])

  // ── Canvas draw ────────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const state = useMapStore.getState()
    const floor = state.getActiveFloor()
    if (!floor) return

    const ctx = canvas.getContext('2d')
    const W = container.clientWidth
    const H = container.clientHeight
    canvas.width = W
    canvas.height = H
    ctx.clearRect(0, 0, W, H)

    const z = zoomRef.current
    const p = panRef.current
    const ts = TILE_SIZE * z

    // Viewport culling bounds
    const colStart = Math.max(0, Math.floor(-p.x / ts) - 1)
    const rowStart = Math.max(0, Math.floor(-p.y / ts) - 1)
    const colEnd = Math.min(COLS, colStart + Math.ceil(W / ts) + 2)
    const rowEnd = Math.min(ROWS, rowStart + Math.ceil(H / ts) + 2)

    // Build fast type index for rendering
    const typeIndex = buildTypeIndex(floor.rooms)

    // Build pending cell set for live preview
    const pending = state.pendingStroke
    const pendingSet = new Set()
    const pendingType = pending?.type || null
    if (pending) {
      for (const c of pending.cells) {
        pendingSet.add(`${c.row},${c.col}`)
      }
    }

    // ── Draw grid dots ────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(148,163,184,0.12)' // subtle dot grid
    for (let r = rowStart; r < rowEnd; r++) {
      for (let c = colStart; c < colEnd; c++) {
        const x = p.x + c * ts
        const y = p.y + r * ts
        ctx.fillRect(x, y, 1, 1) // single pixel dot at each corner
      }
    }

    // ── Draw grid bounds ──────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(148,163,184,0.4)'
    ctx.lineWidth = Math.max(1, 2 * z)
    ctx.strokeRect(p.x, p.y, COLS * ts, ROWS * ts)

    // ── Draw room cells ───────────────────────────────────────────────
    for (let r = rowStart; r < rowEnd; r++) {
      for (let c = colStart; c < colEnd; c++) {
        const key = `${r},${c}`
        const isPendingCell = pendingSet.has(key)
        const roomType = typeIndex.get(key) || (isPendingCell ? pendingType : null)
        if (!roomType) continue

        const tileType = ROOM_TYPES[roomType] || ROOM_TYPES.room
        const x = p.x + c * ts
        const y = p.y + r * ts

        ctx.globalAlpha = isPendingCell ? 0.6 : 1.0
        ctx.fillStyle = tileType.color
        ctx.fillRect(x, y, ts, ts)

        // Grid outline
        ctx.strokeStyle = 'rgba(0,0,0,0.08)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(x, y, ts, ts)

        // Construction hatching
        if (roomType === 'construction') {
          ctx.save()
          ctx.strokeStyle = 'rgba(239,68,68,0.45)'
          ctx.lineWidth = 1
          const spacing = 4 * z
          ctx.beginPath()
          for (let i = -ts; i < ts * 2; i += spacing) {
            ctx.moveTo(x + i, y)
            ctx.lineTo(x + i + ts, y + ts)
          }
          ctx.stroke()
          ctx.restore()
        }
      }
    }
    ctx.globalAlpha = 1.0

    // ── Draw walls ────────────────────────────────────────────────────
    ctx.fillStyle = '#1e293b'
    Object.keys(floor.walls).forEach(wallKey => {
      const [wr, wc, dir] = wallKey.split(',')
      const r = parseInt(wr)
      const c = parseInt(wc)
      if (r < rowStart - 1 || r > rowEnd || c < colStart - 1 || c > colEnd) return
      const wx = p.x + c * ts
      const wy = p.y + r * ts
      const wt = Math.max(2, WALL_THICKNESS * z)
      if (dir === 'right') {
        ctx.fillRect(wx + ts - wt / 2, wy, wt, ts)
      } else {
        ctx.fillRect(wx, wy + ts - wt / 2, ts, wt)
      }
    })

    // ── Draw room labels ──────────────────────────────────────────────
    for (const room of floor.rooms) {
      if (!room.name && !room.number) continue
      if (!room.geometry.length) continue

      // Compute bounds
      let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity
      for (const { row, col } of room.geometry) {
        if (row < minR) minR = row
        if (row > maxR) maxR = row
        if (col < minC) minC = col
        if (col > maxC) maxC = col
      }

      const groupW = maxC - minC + 1
      const groupH = maxR - minR + 1
      const centerX = p.x + (minC + groupW / 2) * ts
      const centerY = p.y + (minR + groupH / 2) * ts

      if (centerX < -100 || centerX > W + 100) continue
      if (centerY < -100 || centerY > H + 100) continue

      const maxWidth = Math.max((groupW * ts) - 4, 1)
      const fontSize = clamp(12 * z, 8, 16)

      const text = room.number
        ? `${room.number}${room.name ? ' · ' + room.name : ''}`
        : room.name

      ctx.save()
      ctx.font = `600 ${fontSize}px 'Inter', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillText(text, centerX + 1, centerY + 1, maxWidth)
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillText(text, centerX, centerY, maxWidth)
      ctx.restore()
    }

    // ── Draw marquee ──────────────────────────────────────────────────
    const mq = state.marqueeSelection
    if (mq) {
      const x1 = p.x + Math.min(mq.startCol, mq.endCol) * ts
      const y1 = p.y + Math.min(mq.startRow, mq.endRow) * ts
      const x2 = p.x + (Math.max(mq.startCol, mq.endCol) + 1) * ts
      const y2 = p.y + (Math.max(mq.startRow, mq.endRow) + 1) * ts

      ctx.save()
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
      ctx.fillStyle = 'rgba(59,130,246,0.08)'
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
      ctx.restore()
    }
  }, [])

  const scheduleRedraw = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(drawCanvas)
  }, [drawCanvas])

  // Redraw on every render (lightweight since RAF batches)
  useEffect(() => { scheduleRedraw() })

  // ResizeObserver
  useEffect(() => {
    const ro = new ResizeObserver(scheduleRedraw)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [scheduleRedraw])

  // ── Keyboard ────────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      // Ignore keyboard shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === ' ') {
        e.preventDefault()
        spaceHeld.current = true
        setSpaceHeldState(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        useMapStore.getState().undo()
        scheduleRedraw()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        useMapStore.getState().redo()
        scheduleRedraw()
      }
      // Tool shortcuts (only when no modifier keys)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const toolShortcuts = {
          h: 'pan', b: 'paint', e: 'erase', w: 'wall',
          m: 'marquee', l: 'label', n: 'node', g: 'edge', k: 'marker',
        }
        const tool = toolShortcuts[e.key.toLowerCase()]
        if (tool) {
          useMapStore.getState().setActiveTool(tool)
        }
      }
    }
    const up = (e) => {
      if (e.key === ' ') {
        spaceHeld.current = false
        setSpaceHeldState(false)
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [scheduleRedraw])

  // ── Zoom ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      const oldZ = zoomRef.current
      const newZ = clamp(oldZ * factor, MIN_ZOOM, MAX_ZOOM)
      const newPan = {
        x: mx - (mx - panRef.current.x) * (newZ / oldZ),
        y: my - (my - panRef.current.y) * (newZ / oldZ),
      }
      zoomRef.current = newZ
      panRef.current = newPan
      setZoom(newZ)
      setPan(newPan)
      scheduleRedraw()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [scheduleRedraw])

  // ── Helpers ─────────────────────────────────────────────────────────
  const getGridCell = useCallback((clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect()
    return screenToGrid(clientX, clientY, panRef.current, zoomRef.current, TILE_SIZE, rect)
  }, [])

  const getScreenPosOfNode = useCallback((node) => ({
    nx: panRef.current.x + (node.col * TILE_SIZE + TILE_SIZE / 2) * zoomRef.current,
    ny: panRef.current.y + (node.row * TILE_SIZE + TILE_SIZE / 2) * zoomRef.current,
  }), [])

  const findClickedNode = useCallback((screenX, screenY, nodes) => {
    const hitRadius = Math.max(NODE_RADIUS + 4, (NODE_RADIUS + 4) * zoomRef.current)
    return nodes?.find(n => {
      const { nx, ny } = getScreenPosOfNode(n)
      return Math.hypot(screenX - nx, screenY - ny) < hitRadius
    })
  }, [getScreenPosOfNode])

  const findClickedMarker = useCallback((screenX, screenY, markers) => {
    const hitRadius = Math.max(12, 12 * zoomRef.current)
    return markers?.find(m => {
      const mx = panRef.current.x + (m.col * TILE_SIZE + TILE_SIZE / 2) * zoomRef.current
      const my = panRef.current.y + (m.row * TILE_SIZE + TILE_SIZE / 2) * zoomRef.current
      return Math.hypot(screenX - mx, screenY - my) < hitRadius
    })
  }, [])

  // ── Mouse down ──────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.button === 1) return // ignore middle click
    const tool = useMapStore.getState().activeTool

    // Pan mode: pan tool OR space held
    const isPanMode = tool === 'pan' || spaceHeld.current
    if (isPanMode) {
      isPanning.current = true
      panStart.current = {
        x: e.clientX - panRef.current.x,
        y: e.clientY - panRef.current.y,
      }
      return
    }

    const { col, row } = getGridCell(e.clientX, e.clientY)
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return

    const rect = containerRef.current.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const floor = useMapStore.getState().getActiveFloor()

    // Paint
    if (tool === 'paint' && e.button === 0) {
      const roomType = useMapStore.getState().activeRoomType
      beginStroke()
      startPaintStroke(roomType)
      addPendingCells([{ row, col }])
      isPainting.current = true
      lastPaintCell.current = { row, col }
      scheduleRedraw()
      return
    }

    // Erase
    if (tool === 'erase' && e.button === 0) {
      const clickedMarker = findClickedMarker(screenX, screenY, floor?.markers)
      if (clickedMarker) {
        beginStroke()
        removeMarker(clickedMarker.id)
        scheduleRedraw()
        return
      }

      const clickedNode = findClickedNode(screenX, screenY, floor?.nodes)
      if (clickedNode) {
        beginStroke()
        removeNode(clickedNode.id)
        scheduleRedraw()
        return
      }

      beginStroke()
      isErasing.current = true
      erasedCells.current = [{ row, col }]
      eraseCells([{ row, col }])
      lastPaintCell.current = { row, col }
      scheduleRedraw()
      return
    }

    // Wall
    if (tool === 'wall' && e.button === 0) {
      beginStroke()
      isDrawingWall.current = true
      lastMousePos.current = { x: e.clientX, y: e.clientY }
      return
    }

    // Marquee
    if (tool === 'marquee' && e.button === 0) {
      isMarquee.current = true
      marqueeStart.current = { row, col }
      setMarqueeSelection({ startRow: row, startCol: col, endRow: row, endCol: col })
      scheduleRedraw()
      return
    }

    // Label
    if (tool === 'label' && e.button === 0) {
      const clickedNode = findClickedNode(screenX, screenY, floor?.nodes)
      if (clickedNode) {
        setNodeLabelPopup({ nodeId: clickedNode.id, anchorX: e.clientX, anchorY: e.clientY })
        return
      }

      const room = useMapStore.getState().getRoomAtCell(row, col)
      if (room) {
        setLabelPopup({ roomId: room.id, anchorX: e.clientX, anchorY: e.clientY })
      }
      return
    }

    // Node
    if (tool === 'node' && e.button === 0) {
      beginStroke()
      placeNode(row, col)
      scheduleRedraw()
      return
    }

    // Edge
    if (tool === 'edge' && e.button === 0) {
      const clicked = findClickedNode(screenX, screenY, floor?.nodes)
      if (clicked) {
        const current = useMapStore.getState().selectedNodeId
        if (!current) {
          setSelectedNode(clicked.id)
        } else if (current === clicked.id) {
          setSelectedNode(null)
        } else {
          beginStroke()
          connectNodes(current, clicked.id)
          setSelectedNode(null)
          scheduleRedraw()
        }
      } else {
        setSelectedNode(null)
      }
      return
    }

    // Marker
    if (tool === 'marker' && e.button === 0) {
      beginStroke()
      placeMarker(row, col)
      scheduleRedraw()
      return
    }
  }

  // ── Mouse move ──────────────────────────────────────────────────────
  const handleMouseMove = (e) => {
    // Panning
    if (isPanning.current) {
      const newPan = {
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }
      panRef.current = newPan
      setPan(newPan)
      scheduleRedraw()
      return
    }

    // Painting
    if (isPainting.current) {
      const { col, row } = getGridCell(e.clientX, e.clientY)
      if (col >= 0 && row >= 0 && col < COLS && row < ROWS) {
        const last = lastPaintCell.current
        if (last) {
          const cells = interpolateCells(last.row, last.col, row, col)
          addPendingCells(cells)
        } else {
          addPendingCells([{ row, col }])
        }
        lastPaintCell.current = { row, col }
        scheduleRedraw()
      }
      return
    }

    // Erasing
    if (isErasing.current) {
      const { col, row } = getGridCell(e.clientX, e.clientY)
      if (col >= 0 && row >= 0 && col < COLS && row < ROWS) {
        const last = lastPaintCell.current
        let cells
        if (last) {
          cells = interpolateCells(last.row, last.col, row, col)
        } else {
          cells = [{ row, col }]
        }
        eraseCells(cells)
        erasedCells.current.push(...cells)
        lastPaintCell.current = { row, col }
        scheduleRedraw()
      }
      return
    }

    // Wall drawing
    if (isDrawingWall.current) {
      const last = lastMousePos.current
      if (!last) {
        lastMousePos.current = { x: e.clientX, y: e.clientY }
        return
      }
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return
      const axis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v'
      lastMousePos.current = { x: e.clientX, y: e.clientY }

      const { col, row, sx, sy } = getGridCell(e.clientX, e.clientY)
      const localX = ((sx % 1) + 1) % 1 * TILE_SIZE
      const localY = ((sy % 1) + 1) % 1 * TILE_SIZE

      let wallRow = row, wallCol = col, wallDir = null
      if (axis === 'h') {
        wallDir = 'bottom'
        wallRow = localY < TILE_SIZE / 2 ? row - 1 : row
      } else {
        wallDir = 'right'
        wallCol = localX < TILE_SIZE / 2 ? col - 1 : col
      }

      if (wallDir && wallRow >= 0 && wallCol >= 0) {
        const wallKey = `${wallRow},${wallCol},${wallDir}`
        if (wallKey !== lastWallRef.current) {
          lastWallRef.current = wallKey
          toggleWall(wallRow, wallCol, wallDir)
          scheduleRedraw()
        }
      }
      return
    }

    // Marquee dragging
    if (isMarquee.current) {
      const { col, row } = getGridCell(e.clientX, e.clientY)
      const clamped = {
        row: clamp(row, 0, ROWS - 1),
        col: clamp(col, 0, COLS - 1),
      }
      setMarqueeSelection({
        startRow: marqueeStart.current.row,
        startCol: marqueeStart.current.col,
        endRow: clamped.row,
        endCol: clamped.col,
      })
      scheduleRedraw()
      return
    }
  }

  // ── Mouse up ────────────────────────────────────────────────────────
  const handleMouseUp = () => {
    if (isPainting.current) {
      finalizePaintStroke()
      scheduleRedraw()
    }
    isPanning.current = false
    isPainting.current = false
    isErasing.current = false
    isDrawingWall.current = false
    isMarquee.current = false
    lastPaintCell.current = null
    lastWallRef.current = null
    lastMousePos.current = null
    erasedCells.current = []
  }

  // ── Right click ─────────────────────────────────────────────────────
  const handleContextMenu = (e) => {
    e.preventDefault()
    const floor = useMapStore.getState().getActiveFloor()
    if (!floor) return
    const tool = useMapStore.getState().activeTool
    const rect = containerRef.current.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    if (tool === 'node') {
      const clicked = findClickedNode(screenX, screenY, floor.nodes)
      if (clicked) { beginStroke(); removeNode(clicked.id); scheduleRedraw() }
    }
    if (tool === 'edge') {
      const clicked = floor.edges.find(edge => {
        const from = floor.nodes.find(n => n.id === edge.from)
        const to = floor.nodes.find(n => n.id === edge.to)
        if (!from || !to) return false
        const mx = panRef.current.x + (from.col + to.col) / 2 * TILE_SIZE * zoomRef.current + (TILE_SIZE / 2) * zoomRef.current
        const my = panRef.current.y + (from.row + to.row) / 2 * TILE_SIZE * zoomRef.current + (TILE_SIZE / 2) * zoomRef.current
        return Math.hypot(screenX - mx, screenY - my) < 16
      })
      if (clicked) { beginStroke(); removeEdge(clicked.id); scheduleRedraw() }
    }
    if (tool === 'marker') {
      const clicked = findClickedMarker(screenX, screenY, floor.markers)
      if (clicked) { beginStroke(); removeMarker(clicked.id); scheduleRedraw() }
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  const floor = getActiveFloor()
  if (!floor) return null

  const tool = activeTool
  const isPanMode = tool === 'pan' || spaceHeldState

  // Determine cursor
  let cursor = TOOLS[tool]?.cursor || 'default'
  if (isPanMode) cursor = isPanning.current ? 'grabbing' : 'grab'

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden select-none relative"
      style={{ background: '#1a2332', cursor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* Canvas — tiles + walls + labels */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      {/* SVG — edges + nodes + markers */}
      <svg
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', overflow: 'hidden',
        }}
      >
        {/* Edges */}
        {floor.edges?.map(edge => {
          const from = floor.nodes.find(n => n.id === edge.from)
          const to = floor.nodes.find(n => n.id === edge.to)
          if (!from || !to) return null
          const x1 = pan.x + (from.col * TILE_SIZE + TILE_SIZE / 2) * zoom
          const y1 = pan.y + (from.row * TILE_SIZE + TILE_SIZE / 2) * zoom
          const x2 = pan.x + (to.col * TILE_SIZE + TILE_SIZE / 2) * zoom
          const y2 = pan.y + (to.row * TILE_SIZE + TILE_SIZE / 2) * zoom
          return (
            <line
              key={edge.id}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#7c3aed"
              strokeWidth={Math.max(1, 1.5 * zoom)}
              strokeDasharray={`${4 * zoom} ${2 * zoom}`}
              opacity={0.75}
            />
          )
        })}

        {/* Nodes */}
        {floor.nodes?.map(node => {
          const cx = pan.x + (node.col * TILE_SIZE + TILE_SIZE / 2) * zoom
          const cy = pan.y + (node.row * TILE_SIZE + TILE_SIZE / 2) * zoom
          const r = Math.max(3, NODE_RADIUS * zoom)
          const isSelected = selectedNodeId === node.id
          const nodeType = NODE_TYPES[node.type] || NODE_TYPES.hallway
          return (
            <circle
              key={node.id}
              cx={cx} cy={cy} r={r}
              fill={isSelected ? '#f59e0b' : nodeType.color}
              stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.6)'}
              strokeWidth={Math.max(1, 1.5 * zoom)}
            />
          )
        })}

        {/* Markers */}
        {floor.markers?.map(marker => {
          const cx = pan.x + (marker.col * TILE_SIZE + TILE_SIZE / 2) * zoom
          const cy = pan.y + (marker.row * TILE_SIZE + TILE_SIZE / 2) * zoom
          const markerType = MARKER_TYPES[marker.type] || MARKER_TYPES.info
          const size = Math.max(10, 14 * zoom)
          return (
            <g key={marker.id}>
              <circle
                cx={cx} cy={cy} r={size / 2}
                fill={markerType.color}
                opacity={0.9}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={Math.max(1, 1.5 * zoom)}
              />
              <text
                x={cx} y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={Math.max(6, 9 * zoom)}
                fontWeight="700"
              >
                {markerType.icon}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Staircase arrow overlays */}
      {floor.rooms
        .filter(r => r.type === 'staircase' && r.geometry.length > 0)
        .map(room => {
          // Compute bounding box center
          let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity
          for (const { row, col } of room.geometry) {
            if (row < minR) minR = row
            if (row > maxR) maxR = row
            if (col < minC) minC = col
            if (col > maxC) maxC = col
          }
          const centerCol = (minC + maxC + 1) / 2
          const centerRow = (minR + maxR + 1) / 2
          const ts = TILE_SIZE * zoom
          const screenX = pan.x + centerCol * ts
          const screenY = pan.y + centerRow * ts

          return (
            <div
              key={room.id}
              style={{
                position: 'absolute',
                left: screenX - 16,
                top: screenY - 16,
                width: 32,
                height: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                zIndex: 30,
              }}
            >
              {[['up', '▲'], ['down', '▼']].map(([dir, icon]) => (
                <button
                  key={dir}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation()
                    navigateStaircase(room.id, dir)
                  }}
                  style={{
                    background: 'rgba(30,41,59,0.92)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 10,
                    lineHeight: 1,
                    padding: '3px 4px',
                    fontWeight: 700,
                    color: '#86efac',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(30,41,59,0.92)'}
                  title={`Go ${dir} one floor`}
                >{icon}</button>
              ))}
            </div>
          )
        })
      }

      {/* Zoom indicator */}
      <div
        className="absolute top-3 right-3 z-30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium pointer-events-none"
        style={{ background: 'rgba(30,41,59,0.85)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
      >
        {Math.round(zoom * 100)}%
      </div>

      {/* Hint bar */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 backdrop-blur-sm rounded-lg px-4 py-1.5 text-xs pointer-events-none whitespace-nowrap"
        style={{ background: 'rgba(30,41,59,0.85)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
      >
        Scroll to zoom · Space + drag to pan · Ctrl+Z / Ctrl+Y
      </div>

      {/* Room properties popup */}
      {labelPopup && (
        <RoomPropertiesPopup
          roomId={labelPopup.roomId}
          anchorX={labelPopup.anchorX}
          anchorY={labelPopup.anchorY}
          onClose={() => setLabelPopup(null)}
        />
      )}

      {/* Node properties popup */}
      {nodeLabelPopup && (
        <NodePropertiesPopup
          nodeId={nodeLabelPopup.nodeId}
          anchorX={nodeLabelPopup.anchorX}
          anchorY={nodeLabelPopup.anchorY}
          onClose={() => setNodeLabelPopup(null)}
        />
      )}
    </div>
  )
}
