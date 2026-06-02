import { useState, useEffect, useRef } from 'react'
import { useMapStore, getFloorLabel } from '../../store/useMapStore'
import MapViewer from '../../components/map/MapViewer'

export default function NavigationScreen({ path, directions, onExit }) {
  const { activeFloorId, setActiveFloor } = useMapStore()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Ensure first step floor is active on mount
  useEffect(() => {
    if (path && path.length > 0 && path[0].floorId !== activeFloorId) {
      setActiveFloor(path[0].floorId)
    }
  }, [path])

  const handleNext = () => {
    if (currentStepIndex < directions.length - 1) {
      const nextStep = directions[currentStepIndex + 1]
      setCurrentStepIndex(i => i + 1)
      
      // Auto-switch floor if next step is on a different floor
      if (nextStep.node.floorId !== activeFloorId) {
        setActiveFloor(nextStep.node.floorId)
      }
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevStep = directions[currentStepIndex - 1]
      setCurrentStepIndex(i => i - 1)

      if (prevStep.node.floorId !== activeFloorId) {
        setActiveFloor(prevStep.node.floorId)
      }
    }
  }

  const currentDir = directions[currentStepIndex]

  if (!currentDir) return null

  // Helpers for icon
  let icon = '📍'
  if (currentDir.type === 'start') icon = '🏁'
  if (currentDir.type === 'straight') icon = '⬆️'
  if (currentDir.type === 'left') icon = '⬅️'
  if (currentDir.type === 'right') icon = '➡️'
  if (currentDir.type === 'turn_around') icon = '↩️'
  if (currentDir.type === 'stairs') icon = '📶'

  // If this step requires climbing stairs, show a prominent floor switch prompt
  const isFloorTransition = currentDir.type === 'stairs' && currentDir.node.floorId !== activeFloorId

  return (
    <div className="w-full h-full relative flex flex-col bg-[#0a0f18]">
      
      {/* Top Bar - Current Instruction */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl p-4 flex items-center gap-4 pointer-events-auto">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-2xl shadow-inner shrink-0">
            {icon}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wide">
              Step {currentStepIndex + 1} of {directions.length}
            </div>
            <div className="text-lg font-bold text-white leading-tight mt-0.5">
              {currentDir.text}
            </div>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapViewer 
          mode="navigation" 
          path={path} 
        />
      </div>

      {/* Floor Transition Overlay */}
      {isFloorTransition && (
        <div className="absolute inset-0 z-30 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 text-center flex flex-col items-center max-w-sm w-full">
            <div className="text-6xl mb-4">📶</div>
            <h2 className="text-2xl font-bold text-white mb-2">{currentDir.text}</h2>
            <p className="text-slate-400 text-sm mb-8">
              Proceed to the staircase and tap the button below once you reach the next floor.
            </p>
            <button 
              onClick={() => setActiveFloor(currentDir.node.floorId)}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              I am on {getFloorLabel(currentDir.node.floorId)}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 p-4 pb-8 flex items-center justify-between">
        <button 
          onClick={onExit}
          className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-lg active:bg-red-500/30 transition-colors border border-red-500/30"
        >
          ✕
        </button>

        <div className="flex gap-2">
          <button 
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="w-14 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed active:bg-slate-700 transition-colors"
          >
            Prev
          </button>
          <button 
            onClick={handleNext}
            disabled={currentStepIndex === directions.length - 1}
            className="w-24 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(37,99,235,0.4)] active:scale-95 transition-all"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  )
}
