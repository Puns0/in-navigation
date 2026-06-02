import { useState, useMemo, useEffect } from 'react'
import { useMapStore, getFloorLabel } from '../store/useMapStore'
import { buildGraph, findShortestPath, generateDirections } from '../utils/pathfinding'
import MapViewer from '../components/map/MapViewer'

export default function NavigationPage() {
  const { floors, activeFloorId, setActiveFloor } = useMapStore()
  
  const [startId, setStartId] = useState('')
  const [endId, setEndId] = useState('')

  // Build the graph once whenever floors change
  const graph = useMemo(() => buildGraph(floors), [floors])

  // Extract all named nodes to populate the dropdowns
  const namedNodes = useMemo(() => {
    const list = []
    for (const [id, node] of graph.entries()) {
      if (node.label) {
        list.push(node)
      }
    }
    // Sort by floor then label
    return list.sort((a, b) => {
      if (a.floorId !== b.floorId) return a.floorId - b.floorId
      return a.label.localeCompare(b.label)
    })
  }, [graph])

  // Find path
  const [path, setPath] = useState(null)
  const [directions, setDirections] = useState([])

  useEffect(() => {
    if (startId && endId && startId !== endId) {
      const p = findShortestPath(graph, startId, endId)
      setPath(p)
      setDirections(generateDirections(p))

      // Auto-switch to starting floor if a path was found
      if (p && p.length > 0 && p[0].floorId !== activeFloorId) {
        setActiveFloor(p[0].floorId)
      }
    } else {
      setPath(null)
      setDirections([])
    }
  }, [startId, endId, graph, activeFloorId, setActiveFloor])

  return (
    <div className="flex-1 w-full h-full flex overflow-hidden bg-slate-900">
      
      {/* Left: Map Preview */}
      <div className="flex-1 relative flex flex-col border-r border-slate-800">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {floors.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFloor(f.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-md shadow-sm border transition-colors ${
                activeFloorId === f.id
                  ? 'bg-orange-500 border-orange-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        <MapViewer mode="navigation" path={path} />
      </div>

      {/* Right: Controls & Directions */}
      <div className="w-80 flex flex-col bg-slate-800">
        <div className="p-5 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4">Routing Setup</h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Start Location (QR / ID)</label>
              <select
                value={startId}
                onChange={e => setStartId(e.target.value)}
                className="w-full bg-slate-900 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-orange-500"
              >
                <option value="">-- Select Start --</option>
                {namedNodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {getFloorLabel(n.floorId)}: {n.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Destination</label>
              <select
                value={endId}
                onChange={e => setEndId(e.target.value)}
                className="w-full bg-slate-900 text-white text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-orange-500"
              >
                <option value="">-- Select Destination --</option>
                {namedNodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {getFloorLabel(n.floorId)}: {n.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Directions List */}
        <div className="flex-1 p-5 overflow-y-auto">
          {startId && endId && startId === endId && (
            <div className="text-sm text-slate-400 text-center mt-10">Start and End locations are the same.</div>
          )}
          
          {startId && endId && startId !== endId && !path && (
            <div className="text-sm text-red-400 text-center mt-10">
              No valid route found. Make sure nodes are connected in the Editor.
            </div>
          )}

          {path && (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200">Turn-by-Turn Directions</h3>
              <div className="flex flex-col gap-3">
                {directions.map((dir, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-600 text-sm">
                      {dir.type === 'start' && '🏁'}
                      {dir.type === 'straight' && '⬆️'}
                      {dir.type === 'left' && '⬅️'}
                      {dir.type === 'right' && '➡️'}
                      {dir.type === 'turn_around' && '↩️'}
                      {dir.type === 'stairs' && '📶'}
                      {dir.type === 'arrive' && '📍'}
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="text-sm font-medium text-slate-200">{dir.text}</div>
                      {dir.node.floorId !== activeFloorId && (
                        <div className="text-xs text-orange-400 mt-1 cursor-pointer hover:underline" onClick={() => setActiveFloor(dir.node.floorId)}>
                          Switch to {getFloorLabel(dir.node.floorId)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
