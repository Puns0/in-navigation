import { useState, useEffect } from 'react'
import { useMapStore } from '../../store/useMapStore'
import { ROOM_TYPES } from '../../constants/roomTypes'

const ROOM_TYPE_LIST = Object.values(ROOM_TYPES)

export default function RoomPropertiesPopup({ roomId, anchorX, anchorY, onClose }) {
  const { getRoomById, updateRoom, deleteRoom, beginStroke } = useMapStore()
  const room = getRoomById(roomId)

  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [type, setType] = useState('room')

  useEffect(() => {
    if (room) {
      setName(room.name || '')
      setNumber(room.number || '')
      setType(room.type || 'room')
    }
  }, [room])

  if (!room) return null

  const handleSave = () => {
    beginStroke()
    updateRoom(roomId, { name, number, type })
    onClose()
  }

  const handleDelete = () => {
    beginStroke()
    deleteRoom(roomId)
    onClose()
  }

  const popupWidth = 260
  const popupHeight = 320
  const left = Math.min(anchorX + 12, window.innerWidth - popupWidth - 16)
  const top = Math.min(anchorY, window.innerHeight - popupHeight - 16)

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={onClose}
      />
      {/* Popup */}
      <div
        className="animate-in slide-in-from-bottom-2 duration-200"
        style={{
          position: 'fixed',
          left,
          top,
          width: popupWidth,
          zIndex: 50,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
          Room Properties — {room.geometry.length} cells
        </div>

        {/* Room name */}
        <Field label="Room name">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Computer Lab 3"
            style={inputStyle}
          />
        </Field>

        {/* Room number */}
        <Field label="Room number">
          <input
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="e.g. B204"
            style={inputStyle}
          />
        </Field>

        {/* Room type */}
        <Field label="Room type">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            style={inputStyle}
          >
            {ROOM_TYPE_LIST.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.label}</option>
            ))}
          </select>
        </Field>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={handleSave} style={saveButtonStyle}>
            Save
          </button>
          <button onClick={handleDelete} style={deleteButtonStyle}>
            Delete
          </button>
          <button onClick={onClose} style={cancelButtonStyle}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
}

const saveButtonStyle = {
  flex: 1,
  padding: '7px 0',
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const deleteButtonStyle = {
  padding: '7px 12px',
  background: 'rgba(239,68,68,0.15)',
  color: 'var(--danger)',
  border: '1px solid rgba(239,68,68,0.3)',
  borderRadius: 8,
  fontSize: 12,
  cursor: 'pointer',
}

const cancelButtonStyle = {
  padding: '7px 12px',
  background: 'var(--bg-elevated)',
  color: 'var(--text-muted)',
  border: '1px solid var(--border-default)',
  borderRadius: 8,
  fontSize: 12,
  cursor: 'pointer',
}
