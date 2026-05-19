import { useState } from 'react'
import { useMapStore } from '../../store/useMapStore'

const ROOM_TYPES = [
  'Classroom', 'Lab', 'Office', 'Toilet', 'Canteen',
  'Auditorium', 'Library', 'Reception', 'Storage', 'Other',
]

const VISIBILITY = ['public', 'semi-public', 'internal']

export default function RoomLabelPopup({ group, anchorX, anchorY, onClose }) {
  const { setGroupLabel } = useMapStore()
  const existing = group.label || {}

  const [name, setName] = useState(existing.name || '')
  const [number, setNumber] = useState(existing.number || '')
  const [department, setDepartment] = useState(existing.department || '')
  const [type, setType] = useState(existing.type || 'Classroom')
  const [visibility, setVisibility] = useState(existing.visibility || 'internal')

  const handleSave = () => {
    setGroupLabel(group.id, { name, number, department, type, visibility })
    onClose()
  }

  const handleClear = () => {
    setGroupLabel(group.id, null)
    onClose()
  }

  const popupWidth = 240
  const popupHeight = 300
  const left = Math.min(anchorX + 12, window.innerWidth - popupWidth - 16)
  const top = Math.min(anchorY, window.innerHeight - popupHeight - 16)

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          left,
          top,
          width: popupWidth,
          zIndex: 50,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 600, fontSize: 12, color: '#475569', marginBottom: 2 }}>
          Label — {group.type} ({group.tiles.length} tiles)
        </div>

        {[
          { label: 'Room name', value: name, set: setName, placeholder: 'e.g. Computer Lab 3' },
          { label: 'Room number', value: number, set: setNumber, placeholder: 'e.g. B204' },
          { label: 'Department', value: department, set: setDepartment, placeholder: 'e.g. CSE' },
        ].map(field => (
          <div key={field.label}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{field.label}</div>
            <input
              value={field.value}
              onChange={e => field.set(e.target.value)}
              placeholder={field.placeholder}
              style={{
                width: '100%',
                padding: '5px 8px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}

        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Room type</div>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            style={{
              width: '100%', padding: '5px 8px',
              borderRadius: 6, border: '1px solid #cbd5e1',
              fontSize: 12, outline: 'none',
            }}
          >
            {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Visibility</div>
          <select
            value={visibility}
            onChange={e => setVisibility(e.target.value)}
            style={{
              width: '100%', padding: '5px 8px',
              borderRadius: 6, border: '1px solid #cbd5e1',
              fontSize: 12, outline: 'none',
            }}
          >
            {VISIBILITY.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1, padding: '6px 0',
              background: '#2563eb', color: 'white',
              border: 'none', borderRadius: 6,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >Save</button>
          <button
            onClick={handleClear}
            style={{
              padding: '6px 10px',
              background: '#f1f5f9', color: '#64748b',
              border: '1px solid #e2e8f0', borderRadius: 6,
              fontSize: 12, cursor: 'pointer',
            }}
          >Clear</button>
        </div>
      </div>
    </>
  )
}