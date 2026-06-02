import { useMapStore } from '../../store/useMapStore'

export default function FloorBar() {
  const { floors, activeFloorId, setActiveFloor, addFloor, removeFloor } = useMapStore()
  const sorted = [...floors].sort((a, b) => a.id - b.id)

  return (
    <div
      className="h-10 flex items-center px-4 gap-2 overflow-x-auto flex-shrink-0 border-b"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      {/* Add basement */}
      <button
        onClick={() => addFloor('down')}
        className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 hover:opacity-80"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
        title="Add basement floor"
      >
        −
      </button>

      <span
        className="text-xs font-semibold uppercase tracking-wider mr-1 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        Floors
      </span>

      {sorted.map(floor => (
        <button
          key={floor.id}
          onClick={() => setActiveFloor(floor.id)}
          onContextMenu={e => {
            e.preventDefault()
            if (floors.length > 1) {
              const hasContent = floor.rooms.length > 0 || floor.nodes.length > 0
              if (!hasContent || confirm(`Delete "${floor.label}"? This cannot be undone.`)) {
                removeFloor(floor.id)
              }
            }
          }}
          className="px-3 py-1 rounded text-xs font-medium transition-colors flex-shrink-0"
          style={
            activeFloorId === floor.id
              ? { background: 'var(--accent)', color: '#fff' }
              : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }
          }
          title={activeFloorId === floor.id ? floor.label : `Switch to ${floor.label} (right-click to delete)`}
        >
          {floor.label}
        </button>
      ))}

      {/* Add upper floor */}
      <button
        onClick={() => addFloor('up')}
        className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 hover:opacity-80"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
        title="Add upper floor"
      >
        +
      </button>
    </div>
  )
}