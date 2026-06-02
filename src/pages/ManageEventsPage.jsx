import { useState } from 'react'
import { useMapStore } from '../store/useMapStore'
import { generateId } from '../utils/id'
import { getFloorLabel } from '../store/useMapStore'

export default function ManageEventsPage() {
  const { events, floors, addEvent, updateEvent, deleteEvent } = useMapStore()
  const [editingId, setEditingId] = useState(null)
  
  // Local state for the form
  const [form, setForm] = useState({
    title: '',
    description: '',
    roomId: '',
    startTime: '',
    endTime: ''
  })

  // Get all rooms from all floors to populate the room dropdown
  const allRooms = floors.flatMap(floor => 
    floor.rooms.map(room => ({
      ...room,
      floorId: floor.id,
      floorLabel: getFloorLabel(floor.id)
    }))
  ).filter(r => r.geometry.length > 0) // only rooms with painted area

  const handleEdit = (event) => {
    setEditingId(event.id)
    setForm({
      title: event.title || '',
      description: event.description || '',
      roomId: event.roomId || '',
      startTime: event.startTime || '',
      endTime: event.endTime || ''
    })
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.title || !form.roomId) {
      alert('Title and Room are required')
      return
    }

    if (editingId) {
      updateEvent(editingId, form)
      setEditingId(null)
    } else {
      addEvent({
        id: generateId('evt'),
        ...form
      })
    }
    
    // reset form
    setForm({ title: '', description: '', roomId: '', startTime: '', endTime: '' })
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm({ title: '', description: '', roomId: '', startTime: '', endTime: '' })
  }

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString(undefined, { 
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col p-8 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Event Management</h1>
          <p className="text-sm text-slate-400">Schedule semantic events for specific rooms.</p>
        </header>

        {/* Form */}
        <form onSubmit={handleSave} className="bg-slate-800/40 border rounded-xl p-6 mb-8" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">{editingId ? 'Edit Event' : 'Add New Event'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Event Title *">
              <input 
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-slate-900 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-purple-500"
                placeholder="e.g. Guest Lecture"
              />
            </Field>

            <Field label="Assigned Room *">
              <select
                required
                value={form.roomId}
                onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}
                className="w-full bg-slate-900 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-purple-500"
              >
                <option value="">-- Select Room --</option>
                {allRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.floorLabel}: {r.number || ''} {r.name || 'Unnamed Room'}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Start Time">
              <input 
                type="datetime-local"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full bg-slate-900 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-purple-500"
              />
            </Field>

            <Field label="End Time">
              <input 
                type="datetime-local"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full bg-slate-900 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-purple-500"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea 
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-slate-900 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-purple-500 h-20 resize-none"
              placeholder="Optional description..."
            />
          </Field>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-md bg-purple-600 hover:bg-purple-500 text-white"
            >
              {editingId ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>

        {/* List */}
        <h2 className="text-lg font-semibold text-slate-200 mb-4">All Events ({events.length})</h2>
        <div className="bg-slate-800/40 border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No events scheduled.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-xs text-slate-400 uppercase tracking-wider border-b" style={{ borderColor: 'var(--border-default)' }}>
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Room</th>
                  <th className="p-4 font-medium">Time</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => {
                  const room = allRooms.find(r => r.id === event.roomId)
                  const roomName = room ? `${room.number || ''} ${room.name || 'Unnamed'}`.trim() : 'Unknown Room'
                  
                  return (
                    <tr key={event.id} className="border-b last:border-0 hover:bg-slate-800/30" style={{ borderColor: 'var(--border-default)' }}>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-slate-200">{event.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{event.description}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-300">
                        <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">{roomName}</span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {event.startTime ? formatDate(event.startTime) : 'Anytime'}
                        {event.endTime && ` - ${formatDate(event.endTime)}`}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleEdit(event)}
                          className="text-xs text-blue-400 hover:text-blue-300 mr-3"
                        >Edit</button>
                        <button 
                          onClick={() => { if(confirm('Delete event?')) deleteEvent(event.id) }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
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
