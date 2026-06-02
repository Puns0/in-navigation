import { useState, useEffect } from 'react'
import { useMapStore } from '../../store/useMapStore'

export default function NodePropertiesPopup({ nodeId, anchorX, anchorY, onClose }) {
  const { floors, activeFloorId, updateNode } = useMapStore()
  
  const floor = floors.find(f => f.id === activeFloorId)
  const node = floor?.nodes.find(n => n.id === nodeId)

  const [label, setLabel] = useState(node?.label || '')

  useEffect(() => {
    setLabel(node?.label || '')
  }, [node])

  if (!node) return null

  const handleSave = () => {
    updateNode(node.id, { label: label.trim() || null })
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onClose()
  }

  // Position popup slightly offset from cursor
  const style = {
    position: 'fixed',
    left: anchorX + 10,
    top: anchorY + 10,
    zIndex: 100
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-4 w-64 z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
        style={style}
      >
        <div className="text-sm font-semibold text-white">Node Properties</div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Node Name (Location Code)</label>
          <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Entrance A"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-purple-500"
          />
          <div className="text-[10px] text-slate-500 mt-1">
            Name this node to make it available as a destination in routing.
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </>
  )
}
