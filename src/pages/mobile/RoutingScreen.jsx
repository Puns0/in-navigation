import { useState, useMemo, useEffect } from 'react'
import { useMapStore, getFloorLabel } from '../../store/useMapStore'
import { buildGraph, findShortestPath, generateDirections } from '../../utils/pathfinding'

export default function RoutingScreen({ onBack, onStartNavigation, initialDestinationName }) {
  const { floors } = useMapStore()
  const graph = useMemo(() => buildGraph(floors), [floors])

  const [startNodeId, setStartNodeId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [error, setError] = useState('')

  const namedNodes = useMemo(() => {
    const list = []
    for (const [id, node] of graph.entries()) {
      if (node.label) list.push(node)
    }
    return list.sort((a, b) => {
      if (a.floorId !== b.floorId) return a.floorId - b.floorId
      return a.label.localeCompare(b.label)
    })
  }, [graph])

  // Auto-populate destination if provided
  useEffect(() => {
    if (typeof initialDestinationName === 'string' && namedNodes.length > 0 && !destinationId) {
      const match = namedNodes.find(n => n.label?.toLowerCase() === initialDestinationName.toLowerCase())
      if (match) {
        setDestinationId(match.id)
      }
    }
  }, [initialDestinationName, namedNodes, destinationId])

  const handleStart = () => {
    setError('')
    
    if (!startNodeId) {
      setError('Please select a start location.')
      return
    }

    const startNode = graph.get(startNodeId)
    
    if (!startNode) {
      setError('Invalid QR Code / Location Code.')
      return
    }

    if (!destinationId) {
      setError('Please select a destination.')
      return
    }

    if (startNode.id === destinationId) {
      setError('Start and destination cannot be the same.')
      return
    }

    const path = findShortestPath(graph, startNode.id, destinationId)
    if (!path || path.length === 0) {
      setError('No route found between these locations.')
      return
    }

    const directions = generateDirections(path)
    onStartNavigation(startNode.id, destinationId, path, directions)
  }

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="pt-6 pb-4 px-4 flex items-center gap-4 bg-slate-950 border-b border-slate-800">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300"
        >
          ✕
        </button>
        <h1 className="text-lg font-bold text-white">Setup Route</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto">
        
        {/* Start Location Select */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <span>📍</span> Choose Start Location
          </label>
          <select
            value={startNodeId}
            onChange={e => setStartNodeId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl text-sm outline-none focus:border-blue-500 appearance-none transition-colors"
          >
            <option value="">-- Select Start --</option>
            {namedNodes.map(n => (
              <option key={n.id} value={n.id}>
                {getFloorLabel(n.floorId)}: {n.label}
              </option>
            ))}
          </select>
        </div>

        {/* Demo QR Gallery */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Demo: Scan QR Code
          </label>
          <div className="grid grid-cols-3 gap-3">
            {namedNodes.length === 0 && (
              <div className="col-span-3 text-xs text-slate-500 italic">No named nodes to scan.</div>
            )}
            {namedNodes.map(n => (
              <button
                key={n.id}
                onClick={() => setStartNodeId(n.id)}
                className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                  startNodeId === n.id ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="w-12 h-12 bg-white rounded flex items-center justify-center p-1 overflow-hidden">
                  <img 
                    src="/qr-code.png"
                    alt={`QR for ${n.label}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null; 
                      // Fallback icon if image doesn't exist
                      e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4h8v8h-8v-8zm2 2h4v4h-4v-4z"/></svg>'
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-300 text-center leading-tight line-clamp-2">
                  {n.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-slate-700/50"></div>
          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-xs">
            to
          </div>
          <div className="w-0.5 h-6 bg-slate-700/50"></div>
        </div>

        {/* Destination Select */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <span>🎯</span> Choose Destination
          </label>
          <select
            value={destinationId}
            onChange={e => setDestinationId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl text-sm outline-none focus:border-blue-500 appearance-none transition-colors"
          >
            <option value="">-- Select Destination --</option>
            {namedNodes.map(n => (
              <option key={n.id} value={n.id}>
                {getFloorLabel(n.floorId)}: {n.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center font-medium animate-in fade-in slide-in-from-top-2 duration-200">
            {error}
          </div>
        )}

        <div className="mt-auto pt-8">
          <button 
            onClick={handleStart}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform text-lg"
          >
            Start Navigation
          </button>
        </div>
      </div>
    </div>
  )
}
