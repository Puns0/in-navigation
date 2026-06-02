import { useState, useMemo } from 'react'
import { useMapStore, getFloorLabel } from '../../store/useMapStore'
import { ROOM_TYPES } from '../../constants/roomTypes'
import MapViewer from '../../components/map/MapViewer'

export default function IndoorScreen({ onBack, onRoute }) {
  const { floors, activeFloorId, setActiveFloor, getRoomById, events } = useMapStore()
  
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  
  const handleRoomSelect = (roomId) => {
    setSelectedRoomId(roomId)
  }

  const selectedRoom = selectedRoomId ? getRoomById(selectedRoomId) : null
  const roomEvents = selectedRoom ? events.filter(e => e.roomId === selectedRoom.id) : []
  const roomType = selectedRoom ? (ROOM_TYPES[selectedRoom.type] || ROOM_TYPES.room) : null

  return (
    <div className="w-full h-full relative flex flex-col bg-[#0a0f18]">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 pointer-events-none">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-slate-900/80 backdrop-blur-md rounded-full flex items-center justify-center border border-slate-700/50 shadow-lg pointer-events-auto active:scale-95 transition-transform"
        >
          <span className="text-xl leading-none -translate-x-0.5">👈</span>
        </button>

        <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 shadow-lg pointer-events-auto text-sm font-bold tracking-wide">
          Main Building
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapViewer 
          mode="rooms" 
          selectedRoomId={selectedRoomId} 
          onRoomSelect={handleRoomSelect} 
        />
      </div>

      {/* FAB - Navigate */}
      <div className="absolute bottom-24 right-4 z-20">
        <button 
          onClick={() => onRoute()}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,99,235,0.4)] border border-blue-400/30 transition-transform active:scale-95"
        >
          <span className="text-2xl">🧭</span>
        </button>
      </div>

      {/* Floor Selector (Floating Bottom-Left) */}
      <div className="absolute bottom-24 left-4 z-20 flex flex-col-reverse gap-2 pointer-events-none">
        {floors.map(f => (
          <button
            key={f.id}
            onClick={() => { setActiveFloor(f.id); setSelectedRoomId(null) }}
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs shadow-lg pointer-events-auto transition-all ${
              activeFloorId === f.id
                ? 'bg-white text-slate-900 scale-110'
                : 'bg-slate-800/90 text-slate-300 border border-slate-600/50 backdrop-blur-sm'
            }`}
          >
            {f.label.replace(/Floor |Basement /g, f.label.includes('Basement') ? 'B' : 'L')}
          </button>
        ))}
      </div>

      {/* Bottom Sheet - Room Info */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-700/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-t-3xl ${
          selectedRoom ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setSelectedRoomId(null)}>
          <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
        </div>

        {selectedRoom && (
          <div className="p-6 pt-2 overflow-y-auto flex-1">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {selectedRoom.number || 'Unnamed'} {selectedRoom.name && `· ${selectedRoom.name}`}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roomType.color }}></div>
                  <span className="text-sm text-slate-400 font-medium tracking-wide uppercase">{roomType.label}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedRoomId(null)}
                className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Events Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span>📅 Scheduled Events</span>
                {roomEvents.length > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">{roomEvents.length}</span>
                )}
              </h3>
              
              {roomEvents.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl p-4 text-center text-sm text-slate-500 border border-slate-700/50">
                  No events currently scheduled.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {roomEvents.map(evt => (
                    <div key={evt.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                      <div className="font-bold text-slate-100">{evt.title}</div>
                      {evt.startTime && (
                        <div className="text-xs font-medium text-blue-400 mt-1">
                          {new Date(evt.startTime).toLocaleString(undefined, { 
                            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                          })}
                          {evt.endTime && ' — ' + new Date(evt.endTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      )}
                      {evt.description && (
                        <div className="text-sm text-slate-400 mt-2 leading-relaxed">{evt.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => onRoute(selectedRoom.name)}
              className="mt-6 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
            >
              Navigate Here
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
