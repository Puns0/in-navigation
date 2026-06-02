import { useMapStore } from '../../store/useMapStore'
import { MARKER_TYPES } from '../../constants/markerTypes'
import { getFloorLabel } from '../../store/useMapStore'

const MARKER_TYPE_LIST = Object.values(MARKER_TYPES)

export default function MarkerDetailPanel() {
  const { selectedMarkerId, getActiveFloor, updateMarker, deleteMarker, beginStroke, floors } = useMapStore()
  
  if (!selectedMarkerId) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm mt-10">
        <div className="text-4xl mb-3 opacity-50">📍</div>
        Click a marker on the map to edit its properties.
      </div>
    )
  }

  const floor = getActiveFloor()
  const marker = floor?.markers.find(m => m.id === selectedMarkerId)
  
  if (!marker) return null

  const markerType = MARKER_TYPES[marker.type] || MARKER_TYPES.info

  const handleChange = (field, value) => {
    beginStroke()
    updateMarker(marker.id, { [field]: value })
  }

  const handleDelete = () => {
    if (confirm('Delete this marker?')) {
      beginStroke()
      deleteMarker(marker.id)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="text-2xl" style={{ color: markerType.color }}>{markerType.icon}</div>
        <div>
          <div className="text-sm font-bold text-white">{marker.label || 'Unnamed Marker'}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">{markerType.label}</div>
        </div>
      </div>

      <Field label="Marker Label">
        <input
          value={marker.label || ''}
          onChange={e => handleChange('label', e.target.value)}
          placeholder="e.g. Fire Exit, Restroom"
          className="w-full bg-slate-800 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-blue-500 transition-colors"
        />
      </Field>

      <Field label="Marker Type">
        <select
          value={marker.type || 'info'}
          onChange={e => handleChange('type', e.target.value)}
          className="w-full bg-slate-800 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-blue-500 transition-colors"
        >
          {MARKER_TYPE_LIST.map(mt => (
            <option key={mt.id} value={mt.id}>{mt.label}</option>
          ))}
        </select>
      </Field>

      {(marker.type === 'stair_up' || marker.type === 'stair_down') && (
        <Field label="Target Floor">
          <select
            value={marker.metadata?.targetFloorId ?? ''}
            onChange={e => handleChange('metadata', { ...marker.metadata, targetFloorId: parseInt(e.target.value) })}
            className="w-full bg-slate-800 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-blue-500 transition-colors"
          >
            <option value="">-- Select Floor --</option>
            {floors.filter(f => f.id !== floor.id).map(f => (
              <option key={f.id} value={f.id}>{getFloorLabel(f.id)}</option>
            ))}
          </select>
        </Field>
      )}

      <div className="pt-4 mt-2 border-t flex flex-col gap-2" style={{ borderColor: 'var(--border-default)' }}>
        <div className="text-xs text-slate-500 flex justify-between">
          <span>Position</span>
          <span className="font-mono">R:{marker.row} C:{marker.col}</span>
        </div>
      </div>

      <button
        onClick={handleDelete}
        className="mt-4 py-2 w-full text-xs font-semibold rounded-md border border-red-500/30 text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
      >
        Delete Marker
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400">{label}</label>
      {children}
    </div>
  )
}
