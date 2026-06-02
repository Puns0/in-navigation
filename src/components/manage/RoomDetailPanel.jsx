import { useMapStore } from '../../store/useMapStore'
import { useAppStore } from '../../store/useAppStore'
import { ROOM_TYPES } from '../../constants/roomTypes'

const ROOM_TYPE_LIST = Object.values(ROOM_TYPES)

export default function RoomDetailPanel() {
  const { selectedRoomId, getRoomById, updateRoom, deleteRoom, beginStroke, events } = useMapStore()
  const { setPage } = useAppStore()

  if (!selectedRoomId) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm mt-10">
        <div className="text-4xl mb-3 opacity-50">👆</div>
        Click a room on the map to edit its properties.
      </div>
    )
  }

  const room = getRoomById(selectedRoomId)
  if (!room) return null

  const roomType = ROOM_TYPES[room.type] || ROOM_TYPES.room

  const handleChange = (field, value) => {
    beginStroke()
    updateRoom(room.id, { [field]: value })
  }

  const handleDelete = () => {
    if (confirm('Delete this room?')) {
      beginStroke()
      deleteRoom(room.id)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="w-5 h-5 rounded" style={{ backgroundColor: roomType.color }} />
        <div>
          <div className="text-sm font-bold text-white">{room.number || 'Unnamed'} {room.name && `· ${room.name}`}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">{roomType.label}</div>
        </div>
      </div>

      <Field label="Room Name">
        <input
          value={room.name || ''}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="e.g. Computer Lab 3"
          className="w-full bg-slate-800 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-blue-500 transition-colors"
        />
      </Field>

      <Field label="Room Number">
        <input
          value={room.number || ''}
          onChange={e => handleChange('number', e.target.value)}
          placeholder="e.g. B204"
          className="w-full bg-slate-800 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-blue-500 transition-colors"
        />
      </Field>

      <Field label="Room Type">
        <select
          value={room.type || 'room'}
          onChange={e => handleChange('type', e.target.value)}
          className="w-full bg-slate-800 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-blue-500 transition-colors"
        >
          {ROOM_TYPE_LIST.map(rt => (
            <option key={rt.id} value={rt.id}>{rt.label}</option>
          ))}
        </select>
      </Field>

      <div className="pt-4 mt-2 border-t flex flex-col gap-2" style={{ borderColor: 'var(--border-default)' }}>
        <div className="text-xs text-slate-500 flex justify-between">
          <span>Area</span>
          <span className="font-mono">{room.geometry.length} cells</span>
        </div>
        <div className="text-xs text-slate-500 flex justify-between">
          <span>ID</span>
          <span className="font-mono">{room.id.substring(0, 8)}...</span>
        </div>
      </div>

      <div className="pt-4 mt-2 border-t flex flex-col gap-3" style={{ borderColor: 'var(--border-default)' }}>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
          <span>Events</span>
          <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[10px]">{events.filter(e => e.roomId === room.id).length}</span>
        </div>
        
        <div className="flex flex-col gap-2">
          {events.filter(e => e.roomId === room.id).length === 0 ? (
            <div className="text-xs text-slate-500 italic">No events scheduled.</div>
          ) : (
            events.filter(e => e.roomId === room.id).map(evt => (
              <div key={evt.id} className="bg-slate-800/60 border border-slate-700 rounded p-2 flex flex-col gap-1">
                <div className="text-xs font-semibold text-slate-200">{evt.title}</div>
                {evt.startTime && (
                  <div className="text-[10px] text-slate-400">
                    {new Date(evt.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => setPage('manage-events')}
          className="py-1.5 mt-1 w-full text-xs font-medium rounded border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors"
        >
          Manage Events
        </button>
      </div>

      <button
        onClick={handleDelete}
        className="mt-4 py-2 w-full text-xs font-semibold rounded-md border border-red-500/30 text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
      >
        Delete Room
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
