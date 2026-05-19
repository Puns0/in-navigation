import { useRef, useEffect, useState, useCallback } from 'react'
import { useMapStore } from '../../store/useMapStore'
import { TILE_TYPES } from '../../constants/tileTypes'
import RoomLabelPopup from './RoomLabelPopup'

const TILE_SIZE = 24
const WALL_THICKNESS = 3
const NODE_RADIUS = 7
const MIN_ZOOM = 0.15
const MAX_ZOOM = 3
const COLS = 100
const ROWS = 100

export default function Grid() {
  const {
    getActiveFloor, paintTile, toggleWall,
    navigateStaircase, activeTool,
    placeNode, removeNode, connectNodes, removeEdge,
    selectedNodeId, setSelectedNode,
  } = useMapStore()

  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 40, y: 40 })
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 40, y: 40 })

  const isPanning = useRef(false)
  const panStart = useRef(null)
  const spaceHeld = useRef(false)
  const [spaceHeldState, setSpaceHeldState] = useState(false)

  const isPainting = useRef(false)
  const isDrawingWall = useRef(false)
  const lastWallRef = useRef(null)
  const lastMousePos = useRef(null)
  const lastPaintCell = useRef(null)
  const heldW = useRef(false)
  const [heldWState, setHeldWState] = useState(false)

  const [labelPopup, setLabelPopup] = useState(null)

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panRef.current = pan }, [pan])

  // ── Canvas draw ───────────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const floor = useMapStore.getState().getActiveFloor()
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

    const colStart = Math.max(0, Math.floor(-p.x / ts) - 1)
    const rowStart = Math.max(0, Math.floor(-p.y / ts) - 1)
    const colEnd = Math.min(COLS, colStart + Math.ceil(W / ts) + 2)
    const rowEnd = Math.min(ROWS, rowStart + Math.ceil(H / ts) + 2)

    for (let r = rowStart; r < rowEnd; r++) {
      for (let c = colStart; c < colEnd; c++) {
        const cell = floor.grid[r]?.[c]
        if (!cell) continue
        const tileType = TILE_TYPES[cell.type] || TILE_TYPES.empty
        const x = p.x + c * ts
        const y = p.y + r * ts

        ctx.fillStyle = tileType.color
        ctx.fillRect(x, y, ts, ts)

        ctx.strokeStyle = 'rgba(0,0,0,0.06)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(x, y, ts, ts)

        if (cell.type === 'construction') {
          ctx.save()
          ctx.strokeStyle = 'rgba(239,68,68,0.5)'
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

    ctx.fillStyle = '#1e293b'
    Object.keys(floor.walls).forEach(key => {
      const [wr, wc, dir] = key.split(',')
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
    
    // Draw group labels
    floor.tileGroups?.forEach(group => {
      if (!group.label?.name && !group.label?.number) return
    
      const groupW = (group.maxCol - group.minCol + 1)
      const groupH = (group.maxRow - group.minRow + 1)
      const centerX = p.x + (group.minCol + groupW / 2) * ts
      const centerY = p.y + (group.minRow + groupH / 2) * ts
    
      // Skip if group center is off screen
      if (centerX < -100 || centerX > W + 100) return
      if (centerY < -100 || centerY > H + 100) return
    
      // Font size scales with group bounding box area, clamped
      const groupArea = groupW * groupH
      const baseFontSize = Math.sqrt(groupArea) * ts * 0.18
      const fontSize = Math.max(8, Math.min(baseFontSize, ts * groupW * 0.5))
    
      const text = group.label.number
        ? `${group.label.number}${group.label.name ? ' · ' + group.label.name : ''}`
        : group.label.name
    
      ctx.save()
      ctx.font = `600 ${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
    
      // Text shadow for readability
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(text, centerX + 1, centerY + 1)
    
      ctx.fillStyle = 'rgba(0,0,0,0.65)'
      ctx.fillText(text, centerX, centerY)
      ctx.restore()
    })
      }, [])
    
      const scheduleRedraw = useCallback(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = requestAnimationFrame(drawCanvas)
      }, [drawCanvas])
    
      useEffect(() => {
        scheduleRedraw()
      })
    
      useEffect(() => {
        const ro = new ResizeObserver(scheduleRedraw)
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
      }, [scheduleRedraw])
    
      // ── Keyboard ──────────────────────────────────────────────────────────────
      useEffect(() => {
        const down = (e) => {
          if (e.key === ' ') {
            e.preventDefault()
            spaceHeld.current = true
            setSpaceHeldState(true)
          }
          if (e.key === 'w' || e.key === 'W') {
            heldW.current = true
            setHeldWState(true)
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
        }
        const up = (e) => {
          if (e.key === ' ') {
            spaceHeld.current = false
            setSpaceHeldState(false)
          }
          if (e.key === 'w' || e.key === 'W') {
            heldW.current = false
            setHeldWState(false)
            isDrawingWall.current = false
            lastWallRef.current = null
            lastMousePos.current = null
          }
        }
        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)
        return () => {
          window.removeEventListener('keydown', down)
          window.removeEventListener('keyup', up)
        }
      }, [scheduleRedraw])

  // ── Zoom ──────────────────────────────────────────────────────────────────
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
      const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZ * factor))
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const screenToCanvas = useCallback((clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect()
    const sx = (clientX - rect.left - panRef.current.x) / (TILE_SIZE * zoomRef.current)
    const sy = (clientY - rect.top - panRef.current.y) / (TILE_SIZE * zoomRef.current)
    return { col: Math.floor(sx), row: Math.floor(sy), sx, sy }
  }, [])

  const interpolatePaint = useCallback((r0, c0, r1, c1) => {
    const dr = Math.abs(r1 - r0)
    const dc = Math.abs(c1 - c0)
    const steps = Math.max(dr, dc, 1)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const r = Math.round(r0 + (r1 - r0) * t)
      const c = Math.round(c0 + (c1 - c0) * t)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        paintTile(r, c)
      }
    }
  }, [paintTile])

  const getScreenPosOfNode = useCallback((node) => {
    return {
      nx: panRef.current.x + (node.col * TILE_SIZE + TILE_SIZE / 2) * zoomRef.current,
      ny: panRef.current.y + (node.row * TILE_SIZE + TILE_SIZE / 2) * zoomRef.current,
    }
  }, [])

  const findClickedNode = useCallback((screenX, screenY, nodes) => {
    const hitRadius = Math.max(NODE_RADIUS + 4, (NODE_RADIUS + 4) * zoomRef.current)
    return nodes?.find(n => {
      const { nx, ny } = getScreenPosOfNode(n)
      return Math.hypot(screenX - nx, screenY - ny) < hitRadius
    })
  }, [getScreenPosOfNode])

  // ── Mouse down ────────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.button === 1) return

    const isPanMode = activeTool === 'pan' || spaceHeld.current
    if (isPanMode) {
      isPanning.current = true
      panStart.current = {
        x: e.clientX - panRef.current.x,
        y: e.clientY - panRef.current.y,
      }
      return
    }

    if (heldW.current) {
      isDrawingWall.current = true
      lastMousePos.current = { x: e.clientX, y: e.clientY }
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const { col, row } = screenToCanvas(e.clientX, e.clientY)
    const floor = useMapStore.getState().getActiveFloor()

    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return

    if (activeTool === 'paint' || activeTool === 'erase') {
      isPainting.current = true
      lastPaintCell.current = { row, col }
      paintTile(row, col)
    }

    if (activeTool === 'label') {
      const cell = floor?.grid[row]?.[col]
      if (cell && cell.type !== 'empty') {
        const group = useMapStore.getState().getGroupAtTile(row, col)
          if (group) {
            setLabelPopup({ group, anchorX: e.clientX, anchorY: e.clientY })
          }
      }
    }

    if (activeTool === 'node' && e.button === 0) {
      placeNode(row, col)
    }

    if (activeTool === 'edge' && e.button === 0) {
      const clicked = findClickedNode(screenX, screenY, floor?.nodes)
      if (clicked) {
        const current = useMapStore.getState().selectedNodeId
        if (!current) {
          setSelectedNode(clicked.id)
        } else if (current === clicked.id) {
          setSelectedNode(null)
        } else {
          connectNodes(current, clicked.id)
          setSelectedNode(null)
        }
      } else {
        setSelectedNode(null)
      }
    }
  }

  // ── Mouse move ────────────────────────────────────────────────────────────
  const handleMouseMove = (e) => {
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

    if (isPainting.current) {
      const { col, row } = screenToCanvas(e.clientX, e.clientY)
      if (col >= 0 && row >= 0 && col < COLS && row < ROWS) {
        const last = lastPaintCell.current
        if (last) {
          interpolatePaint(last.row, last.col, row, col)
        } else {
          paintTile(row, col)
        }
        lastPaintCell.current = { row, col }
        scheduleRedraw()
      }
      return
    }

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

      const { col, row, sx, sy } = screenToCanvas(e.clientX, e.clientY)
      const localX = ((sx % 1) + 1) % 1 * TILE_SIZE
      const localY = ((sy % 1) + 1) % 1 * TILE_SIZE
      const forceRemove = activeTool === 'erase'

      let wallRow = row
      let wallCol = col
      let wallDir = null

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
          toggleWall(wallRow, wallCol, wallDir, forceRemove)
          scheduleRedraw()
        }
      }
    }
  }

  // ── Mouse up ──────────────────────────────────────────────────────────────
  const handleMouseUp = () => {
    isPanning.current = false
    isPainting.current = false
    isDrawingWall.current = false
    lastWallRef.current = null
    lastMousePos.current = null
    lastPaintCell.current = null
  }

  // ── Right click ───────────────────────────────────────────────────────────
  const handleContextMenu = (e) => {
    e.preventDefault()
    const floor = useMapStore.getState().getActiveFloor()
    if (!floor) return

    const rect = containerRef.current.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    if (activeTool === 'node') {
      const clicked = findClickedNode(screenX, screenY, floor.nodes)
      if (clicked) removeNode(clicked.id)
    }

    if (activeTool === 'edge') {
      const clicked = floor.edges.find(edge => {
        const from = floor.nodes.find(n => n.id === edge.from)
        const to = floor.nodes.find(n => n.id === edge.to)
        if (!from || !to) return false
        const mx = panRef.current.x + (from.col + to.col) / 2 * TILE_SIZE * zoomRef.current + (TILE_SIZE / 2) * zoomRef.current
        const my = panRef.current.y + (from.row + to.row) / 2 * TILE_SIZE * zoomRef.current + (TILE_SIZE / 2) * zoomRef.current
        return Math.hypot(screenX - mx, screenY - my) < 16
      })
      if (clicked) removeEdge(clicked.id)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const floor = getActiveFloor()
  if (!floor) return null

  const isPanMode = activeTool === 'pan' || spaceHeldState
  const ts = TILE_SIZE * zoom

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-gray-200 select-none relative"
      style={{
        cursor: isPanMode
          ? (isPanning.current ? 'grabbing' : 'grab')
          : heldWState ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* Canvas — tiles + walls */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      {/* SVG — edges + nodes */}
      <svg
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', overflow: 'hidden',
        }}
      >
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

        {floor.nodes?.map(node => {
          const cx = pan.x + (node.col * TILE_SIZE + TILE_SIZE / 2) * zoom
          const cy = pan.y + (node.row * TILE_SIZE + TILE_SIZE / 2) * zoom
          const r = Math.max(3, NODE_RADIUS * zoom)
          const isSelected = selectedNodeId === node.id
          return (
            <circle
              key={node.id}
              cx={cx} cy={cy} r={r}
              fill={isSelected ? '#f59e0b' : '#7c3aed'}
              stroke="white"
              strokeWidth={Math.max(1, 1.5 * zoom)}
            />
          )
        })}
      </svg>

      {/* Staircase arrows */}
      {floor.tileGroups?.filter(g => g.type === 'staircase').map(group => {
        const centerCol = (group.minCol + group.maxCol + 1) / 2
        const centerRow = (group.minRow + group.maxRow + 1) / 2
        const screenX = pan.x + centerCol * ts
        const screenY = pan.y + centerRow * ts
        const refTile = group.tiles[0]
        return (
          <div
            key={group.id}
            style={{
              position: 'absolute',
              left: screenX - 14,
              top: screenY - 14,
              width: 28,
              height: 28,
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
                  navigateStaircase(refTile.row, refTile.col, dir)
                }}
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 9,
                  lineHeight: 1,
                  padding: '2px 3px',
                  fontWeight: 700,
                }}
              >{icon}</button>
            ))}
          </div>
        )
      })}

      {/* Zoom indicator */}
      <div className="absolute top-3 right-3 z-30 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 font-medium pointer-events-none">
        {Math.round(zoom * 100)}%
      </div>

      {/* Hint bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-1.5 text-xs text-gray-500 pointer-events-none whitespace-nowrap">
        Scroll to zoom · Space + drag to pan · W + drag for walls · Ctrl+Z / Ctrl+Y
      </div>

      {/* Room label popup */}
      {labelPopup && (
        <RoomLabelPopup
          group={labelPopup.group}
          anchorX={labelPopup.anchorX}
          anchorY={labelPopup.anchorY}
          onClose={() => setLabelPopup(null)}
        />
      )}
    </div>
  )
}