import { useRef, useEffect, useState, useCallback } from 'react'
import { useMapStore, COLS, ROWS } from '../../store/useMapStore'
import { useShallow } from 'zustand/react/shallow'
import { ROOM_TYPES } from '../../constants/roomTypes'
import { MARKER_TYPES } from '../../constants/markerTypes'
import { screenToGrid, clamp } from '../../utils/geometry'
import { buildTypeIndex } from '../../utils/cellIndex'

const TILE_SIZE = 24
const WALL_THICKNESS = 3
const MIN_ZOOM = 0.15
const MAX_ZOOM = 3

export default function MapViewer({ mode, selectedRoomId, onRoomSelect, selectedMarkerId, onMarkerSelect, path }) {
  const { activeFloorId, getActiveFloor, navigateStaircase } = useMapStore(useShallow(state => ({
    activeFloorId: state.activeFloorId,
    getActiveFloor: state.getActiveFloor,
    navigateStaircase: state.navigateStaircase,
  })))

  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 40, y: 40 })
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 40, y: 40 })

  const isPanning = useRef(false)
  const panStart = useRef(null)
  
  // Touch state
  const initialPinchDist = useRef(null)
  const initialPinchZoom = useRef(null)

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panRef.current = pan }, [pan])

  // Center on marker on load
  useEffect(() => {
    const floor = getActiveFloor()
    if (!floor || !containerRef.current) return
    const centerMarker = floor.markers.find(m => m.type === 'center')
    if (centerMarker) {
      const W = containerRef.current.clientWidth || window.innerWidth
      const H = containerRef.current.clientHeight || window.innerHeight
      const z = zoomRef.current
      const markerX = (centerMarker.col * TILE_SIZE + TILE_SIZE / 2) * z
      const markerY = (centerMarker.row * TILE_SIZE + TILE_SIZE / 2) * z
      
      const newPan = {
        x: W / 2 - markerX,
        y: H / 2 - markerY
      }
      setPan(newPan)
      panRef.current = newPan
    }
  }, [activeFloorId, getActiveFloor])

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

    const typeIndex = buildTypeIndex(floor.rooms)

    // Highlight set for selected room
    const selectedRoom = floor.rooms.find(r => r.id === selectedRoomId)
    const selectedCells = new Set(selectedRoom?.geometry.map(c => `${c.row},${c.col}`) || [])

    // ── Draw room cells ───────────────────────────────────────────────
    for (let r = rowStart; r < rowEnd; r++) {
      for (let c = colStart; c < colEnd; c++) {
        const key = `${r},${c}`
        const roomType = typeIndex.get(key)
        if (!roomType) continue

        const tileType = ROOM_TYPES[roomType] || ROOM_TYPES.room
        const x = p.x + c * ts
        const y = p.y + r * ts

        ctx.fillStyle = tileType.color
        ctx.fillRect(x, y, ts, ts)

        if (selectedCells.has(key) && mode === 'rooms') {
          ctx.fillStyle = 'rgba(255,255,255,0.2)'
          ctx.fillRect(x, y, ts, ts)
        }

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

    // ── Draw walls ────────────────────────────────────────────────────
    ctx.fillStyle = '#1e293b' // darker walls for viewer
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

    // ── Draw selected room outline ────────────────────────────────────
    if (selectedRoom && mode === 'rooms') {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = Math.max(2, 2 * z)
      for (const { row, col } of selectedRoom.geometry) {
        const x = p.x + col * ts
        const y = p.y + row * ts
        // check neighbors to draw only outer outline
        if (!selectedCells.has(`${row - 1},${col}`)) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ts, y); ctx.stroke()
        }
        if (!selectedCells.has(`${row + 1},${col}`)) {
          ctx.beginPath(); ctx.moveTo(x, y + ts); ctx.lineTo(x + ts, y + ts); ctx.stroke()
        }
        if (!selectedCells.has(`${row},${col - 1}`)) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + ts); ctx.stroke()
        }
        if (!selectedCells.has(`${row},${col + 1}`)) {
          ctx.beginPath(); ctx.moveTo(x + ts, y); ctx.lineTo(x + ts, y + ts); ctx.stroke()
        }
      }
    }

    // ── Draw room labels ──────────────────────────────────────────────
    for (const room of floor.rooms) {
      if (!room.name && !room.number) continue
      if (!room.geometry.length) continue

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
      
      ctx.fillStyle = room.id === selectedRoomId && mode === 'rooms' ? '#fff' : 'rgba(255,255,255,0.9)'
      ctx.fillText(text, centerX, centerY, maxWidth)
      ctx.restore()
    }
  }, [selectedRoomId, mode])

  const scheduleRedraw = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(drawCanvas)
  }, [drawCanvas])

  useEffect(() => { scheduleRedraw() })

  useEffect(() => {
    const ro = new ResizeObserver(scheduleRedraw)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
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

  const getGridCell = useCallback((clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect()
    return screenToGrid(clientX, clientY, panRef.current, zoomRef.current, TILE_SIZE, rect)
  }, [])

  const findClickedMarker = useCallback((screenX, screenY, markers) => {
    const hitRadius = Math.max(24, 24 * zoomRef.current)
    return markers?.find(m => {
      const mx = panRef.current.x + (m.col * TILE_SIZE + TILE_SIZE / 2) * zoomRef.current
      const my = panRef.current.y + (m.row * TILE_SIZE + TILE_SIZE / 2) * zoomRef.current
      return Math.hypot(screenX - mx, screenY - my) < hitRadius
    })
  }, [])

  // ── Mouse events ────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    isPanning.current = true
    panStart.current = {
      x: e.clientX - panRef.current.x,
      y: e.clientY - panRef.current.y,
    }
  }

  const handleMouseMove = (e) => {
    if (isPanning.current) {
      const newPan = {
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }
      panRef.current = newPan
      setPan(newPan)
      scheduleRedraw()
    }
  }

  const handleMouseUp = (e) => {
    const wasPanning = isPanning.current && panStart.current && 
      (Math.abs(e.clientX - panStart.current.x - panRef.current.x) > 2 || 
       Math.abs(e.clientY - panStart.current.y - panRef.current.y) > 2)
       
    isPanning.current = false
    
    if (wasPanning) return

    const { col, row } = getGridCell(e.clientX, e.clientY)
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return

    const rect = containerRef.current.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const floor = useMapStore.getState().getActiveFloor()

    if (mode === 'markers') {
      const clicked = findClickedMarker(screenX, screenY, floor?.markers)
      if (clicked) {
        onMarkerSelect?.(clicked.id)
      } else {
        onMarkerSelect?.(null)
      }
    } else {
      const room = useMapStore.getState().getRoomAtCell(row, col)
      if (room) {
        onRoomSelect?.(room.id)
      } else {
        onRoomSelect?.(null)
      }
    }
  }

  // ── Touch events ────────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isPanning.current = true
      panStart.current = {
        x: e.touches[0].clientX - panRef.current.x,
        y: e.touches[0].clientY - panRef.current.y,
      }
    } else if (e.touches.length === 2) {
      isPanning.current = false
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      initialPinchDist.current = Math.hypot(dx, dy)
      initialPinchZoom.current = zoomRef.current
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isPanning.current) {
      const newPan = {
        x: e.touches[0].clientX - panStart.current.x,
        y: e.touches[0].clientY - panStart.current.y,
      }
      panRef.current = newPan
      setPan(newPan)
      scheduleRedraw()
    } else if (e.touches.length === 2 && initialPinchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      
      const factor = dist / initialPinchDist.current
      const newZ = clamp(initialPinchZoom.current * factor, MIN_ZOOM, MAX_ZOOM)
      
      // Calculate center of pinch to zoom around it
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const rect = containerRef.current.getBoundingClientRect()
      const mx = cx - rect.left
      const my = cy - rect.top

      const oldZ = zoomRef.current
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
  }

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      initialPinchDist.current = null
      initialPinchZoom.current = null
    }
    if (e.touches.length === 0) {
      // Simulate tap if we didn't pan significantly
      if (isPanning.current && panStart.current) {
        const touch = e.changedTouches[0]
        const dx = Math.abs(touch.clientX - panStart.current.x - panRef.current.x)
        const dy = Math.abs(touch.clientY - panStart.current.y - panRef.current.y)
        
        isPanning.current = false
        
        if (dx < 10 && dy < 10) {
          // Tap!
          const { col, row } = getGridCell(touch.clientX, touch.clientY)
          if (col >= 0 && row >= 0 && col < COLS && row < ROWS) {
            const rect = containerRef.current.getBoundingClientRect()
            const screenX = touch.clientX - rect.left
            const screenY = touch.clientY - rect.top
            const floor = useMapStore.getState().getActiveFloor()

            if (mode === 'markers') {
              const clicked = findClickedMarker(screenX, screenY, floor?.markers)
              if (clicked) onMarkerSelect?.(clicked.id)
              else onMarkerSelect?.(null)
            } else {
              const room = useMapStore.getState().getRoomAtCell(row, col)
              if (room) onRoomSelect?.(room.id)
              else onRoomSelect?.(null)
            }
          }
        }
      }
      isPanning.current = false
    } else if (e.touches.length === 1) {
      // Switch back to panning mode from pinch
      isPanning.current = true
      panStart.current = {
        x: e.touches[0].clientX - panRef.current.x,
        y: e.touches[0].clientY - panRef.current.y,
      }
    }
  }

  const floor = getActiveFloor()
  if (!floor) return null

  const ts = TILE_SIZE * zoom

  return (
    <div
      ref={containerRef}
      className="w-full h-full select-none relative"
      style={{ background: '#0a0f18', cursor: isPanning.current ? 'grabbing' : 'pointer' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { isPanning.current = false }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      {/* SVG — path + markers */}
      <svg
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', overflow: 'hidden',
        }}
      >
        {/* Draw Path */}
        {path && path.length > 0 && (
          <path
            d={path.reduce((str, node, i) => {
              if (node.floorId !== floor.id) return str // Skip nodes not on this floor
              const nx = pan.x + (node.col * TILE_SIZE + TILE_SIZE / 2) * zoom
              const ny = pan.y + (node.row * TILE_SIZE + TILE_SIZE / 2) * zoom
              
              // If previous node was on same floor, lineTo. Otherwise moveTo.
              const prev = i > 0 ? path[i - 1] : null
              const isContiguous = prev && prev.floorId === floor.id

              if (str.length === 0 || !isContiguous) {
                return str + ` M ${nx},${ny}`
              } else {
                return str + ` L ${nx},${ny}`
              }
            }, '')}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={Math.max(2, 4 * zoom)}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' }}
          />
        )}

        {floor.markers?.map(marker => {
          const cx = pan.x + (marker.col * TILE_SIZE + TILE_SIZE / 2) * zoom
          const cy = pan.y + (marker.row * TILE_SIZE + TILE_SIZE / 2) * zoom
          const markerType = MARKER_TYPES[marker.type] || MARKER_TYPES.info
          const size = Math.max(12, 16 * zoom)
          const isSelected = selectedMarkerId === marker.id && mode === 'markers'
          return (
            <g key={marker.id}>
              {isSelected && (
                <circle cx={cx} cy={cy} r={size/2 + 4} fill="transparent" stroke="#fff" strokeWidth={2} />
              )}
              <circle
                cx={cx} cy={cy} r={size / 2}
                fill={markerType.color}
                opacity={mode === 'markers' ? 1 : 0.6}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={Math.max(1, 1.5 * zoom)}
              />
              <text
                x={cx} y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={Math.max(7, 10 * zoom)}
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
          let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity
          for (const { row, col } of room.geometry) {
            if (row < minR) minR = row; if (row > maxR) maxR = row
            if (col < minC) minC = col; if (col > maxC) maxC = col
          }
          const centerCol = (minC + maxC + 1) / 2
          const centerRow = (minR + maxR + 1) / 2
          const screenX = pan.x + centerCol * ts
          const screenY = pan.y + centerRow * ts

          return (
            <div
              key={room.id}
              style={{
                position: 'absolute', left: screenX - 16, top: screenY - 16,
                width: 32, height: 32, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2, zIndex: 30,
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
                    borderRadius: 4, cursor: 'pointer',
                    fontSize: 10, lineHeight: 1, padding: '3px 4px',
                    fontWeight: 700, color: '#86efac', transition: 'background 0.15s',
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
    </div>
  )
}
