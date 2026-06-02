import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import CampusScreen from './CampusScreen'
import IndoorScreen from './IndoorScreen'
import RoutingScreen from './RoutingScreen'
import NavigationScreen from './NavigationScreen'

export default function MobileAppPage() {
  const { setPage } = useAppStore()
  // Screens: 'campus', 'indoor', 'routing', 'navigation'
  const [screen, setScreen] = useState('campus')
  
  // Navigation State
  const [startNodeId, setStartNodeId] = useState(null)
  const [endNodeId, setEndNodeId] = useState(null)
  const [initialDestinationName, setInitialDestinationName] = useState(null)
  const [path, setPath] = useState(null)
  const [directions, setDirections] = useState([])

  return (
    <div className="w-screen h-screen bg-slate-900 text-white flex justify-center overflow-hidden relative">
      {/* Floating Exit Button */}
      <button 
        onClick={() => setPage('dashboard')}
        className="absolute top-4 left-4 z-50 bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2 rounded-full font-semibold text-sm border border-slate-600 shadow-xl flex items-center gap-2 backdrop-blur-sm transition-colors"
      >
        <span>←</span> Exit Preview
      </button>

      {/* Mobile container constraint to simulate phone on desktop */}
      <div className="w-full h-full max-w-md bg-slate-950 relative shadow-2xl overflow-hidden flex flex-col mx-auto border-x border-slate-800">
        {screen === 'campus' && (
          <CampusScreen 
            onEnterBuilding={() => setScreen('indoor')} 
          />
        )}
        
        {screen === 'indoor' && (
          <IndoorScreen 
            onBack={() => setScreen('campus')}
            onRoute={(roomName) => {
              setInitialDestinationName(roomName)
              setScreen('routing')
            }}
          />
        )}

        {screen === 'routing' && (
          <RoutingScreen
            initialDestinationName={initialDestinationName}
            onBack={() => setScreen('indoor')}
            onStartNavigation={(start, end, p, dirs) => {
              setStartNodeId(start)
              setEndNodeId(end)
              setPath(p)
              setDirections(dirs)
              setScreen('navigation')
            }}
          />
        )}

        {screen === 'navigation' && (
          <NavigationScreen
            path={path}
            directions={directions}
            onExit={() => {
              setPath(null)
              setDirections([])
              setScreen('indoor')
            }}
          />
        )}
      </div>
    </div>
  )
}
