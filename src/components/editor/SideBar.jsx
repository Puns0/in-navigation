import { useRef } from 'react'
import { TOOLS } from '../../constants/tools'
import { ROOM_TYPES } from '../../constants/roomTypes'
import { NODE_TYPES } from '../../constants/nodeTypes'
import { MARKER_TYPES } from '../../constants/markerTypes'
import { useMapStore } from '../../store/useMapStore'

const TOOL_LIST = Object.values(TOOLS)

export default function Sidebar() {
  const {
    activeTool, activeRoomType, activeNodeType, activeMarkerType,
    setActiveTool, setActiveRoomType, setActiveNodeType, setActiveMarkerType,
    loadFromLocalStorage,
  } = useMapStore()

  const fileRef = useRef()

  return (
    <div
      className="w-56 h-full flex flex-col p-3 gap-4 overflow-y-auto flex-shrink-0 border-r"
      style={{ background: '#162032', borderColor: 'var(--border-default)' }}
    >
      {/* ── Tools ─────────────────────────────────────────────── */}
      <Section title="Tools">
        <div className="flex flex-col gap-1">
          {TOOL_LIST.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="flex items-center gap-2 text-left px-3 py-2 rounded-md text-xs font-medium transition-colors"
              style={
                activeTool === tool.id
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }
              }
            >
              <span style={{ fontSize: 13 }}>{tool.icon}</span>
              <span className="flex-1">{tool.label}</span>
              <span className="shortcut-hint">{tool.shortcut}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Room type palette ─────────────────────────────────── */}
      {(activeTool === 'paint' || activeTool === 'marquee') && (
        <Section title="Room Type">
          <div className="flex flex-col gap-1">
            {Object.values(ROOM_TYPES).map(rt => (
              <button
                key={rt.id}
                onClick={() => { setActiveRoomType(rt.id); if (activeTool !== 'paint') setActiveTool('paint') }}
                className="flex items-center gap-2 text-left px-3 py-2 rounded-md text-xs transition-colors"
                style={
                  activeRoomType === rt.id && activeTool === 'paint'
                    ? { background: 'var(--bg-surface)', color: 'var(--text-primary)', boxShadow: `inset 0 0 0 2px var(--accent)` }
                    : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }
                }
              >
                <span
                  className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: rt.color, border: '1px solid rgba(255,255,255,0.15)' }}
                />
                <span>{rt.label}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── Node type palette ─────────────────────────────────── */}
      {activeTool === 'node' && (
        <Section title="Node Type">
          <div className="flex flex-col gap-1">
            {Object.values(NODE_TYPES).map(nt => (
              <button
                key={nt.id}
                onClick={() => setActiveNodeType(nt.id)}
                className="flex items-center gap-2 text-left px-3 py-2 rounded-md text-xs transition-colors"
                style={
                  activeNodeType === nt.id
                    ? { background: 'var(--bg-surface)', color: 'var(--text-primary)', boxShadow: `inset 0 0 0 2px ${nt.color}` }
                    : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }
                }
              >
                <span style={{ color: nt.color, fontSize: 11 }}>{nt.icon}</span>
                <span>{nt.label}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── Marker type palette ───────────────────────────────── */}
      {activeTool === 'marker' && (
        <Section title="Marker Type">
          <div className="flex flex-col gap-1">
            {Object.values(MARKER_TYPES).map(mt => (
              <button
                key={mt.id}
                onClick={() => setActiveMarkerType(mt.id)}
                className="flex items-center gap-2 text-left px-3 py-2 rounded-md text-xs transition-colors"
                style={
                  activeMarkerType === mt.id
                    ? { background: 'var(--bg-surface)', color: 'var(--text-primary)', boxShadow: `inset 0 0 0 2px ${mt.color}` }
                    : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }
                }
              >
                <span style={{ fontSize: 12 }}>{mt.icon}</span>
                <span>{mt.label}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── Contextual hints ──────────────────────────────────── */}
      <HintBox tool={activeTool} />

      {/* ── Data (bottom) ─────────────────────────────────────── */}
      <div className="mt-auto">
        <Section title="Map Data">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                const ok = loadFromLocalStorage()
                if (!ok) alert('No saved map found.')
              }}
              className="px-3 py-2 rounded-md text-xs font-medium hover:opacity-80"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
            >
              📂 Load Saved Map
            </button>
          </div>
        </Section>
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

// ── Contextual hint boxes ──────────────────────────────────────────────────
function HintBox({ tool }) {
  const hints = {
    pan:     'Click and drag to pan the map. You can also hold Space in any tool.',
    paint:   'Click + drag to paint cells. One stroke = one room entity.',
    erase:   'Click + drag to erase cells from rooms.',
    wall:    'Click + drag on tile edges to draw walls. Walls divide rooms visually.',
    marquee: 'Click + drag to select a rectangular region.',
    label:   'Click on a room to edit its properties (name, number, type).',
    node:    'Click to place a navigation node. Right-click to delete.',
    edge:    'Click a node to select it, then click another to connect. Right-click to delete an edge.',
    marker:  'Click to place a marker. Right-click to delete.',
  }

  const text = hints[tool]
  if (!text) return null

  return (
    <div
      className="rounded-md px-3 py-2 text-xs leading-relaxed"
      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
    >
      {text}
    </div>
  )
}
