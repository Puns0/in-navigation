import { useState } from 'react'
import FloorBar from '../components/editor/FloorBar'
import MapViewer from '../components/map/MapViewer'
import RoomDetailPanel from '../components/manage/RoomDetailPanel'
import MarkerDetailPanel from '../components/manage/MarkerDetailPanel'
import { useMapStore } from '../store/useMapStore'

export default function ManageRoomsPage() {
  const [activeTab, setActiveTab] = useState('rooms') // 'rooms' | 'markers'
  const { selectedRoomId, selectedMarkerId, setSelectedRoom, setSelectedMarker } = useMapStore()

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <FloorBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative border-r" style={{ borderColor: 'var(--border-default)' }}>
          <MapViewer 
            mode={activeTab} 
            selectedRoomId={selectedRoomId}
            onRoomSelect={(id) => setSelectedRoom(id)}
            selectedMarkerId={selectedMarkerId}
            onMarkerSelect={(id) => setSelectedMarker(id)}
          />
        </div>

        {/* Side Panel */}
        <div className="w-72 h-full flex flex-col flex-shrink-0" style={{ background: '#121a28' }}>
          {/* Tabs */}
          <div className="flex p-2 gap-1 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded ${activeTab === 'rooms' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'}`}
            >
              Rooms
            </button>
            <button
              onClick={() => setActiveTab('markers')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded ${activeTab === 'markers' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'}`}
            >
              Markers
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'rooms' ? (
              <RoomDetailPanel />
            ) : (
              <MarkerDetailPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
