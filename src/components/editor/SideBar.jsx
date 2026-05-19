import { useRef } from 'react'
import { TILE_TYPES } from '../../constants/tileTypes'
import { useMapStore } from '../../store/useMapStore'

const TOOL_SECTIONS = [
  {
    label: 'Tools',
    tools: [
      { id: 'pan', icon: '✋', label: 'Pan' },
      { id: 'paint', icon: '🖌', label: 'Paint' },
      { id: 'erase', icon: '🧹', label: 'Erase' },
      { id: 'label', icon: '🏷', label: 'Label' },
      { id: 'node', icon: '⬤', label: 'Place Node' },
      { id: 'edge', icon: '↔', label: 'Draw Edge' },
    ],
  },
]

export default function Sidebar() {
  const {
    activeTool, activeTileType,
    setActiveTool, setActiveTileType,
    undo, redo, history, future,
    saveToLocalStorage, loadFromLocalStorage,
    exportJSON, importJSON,
  } = useMapStore()

  const fileRef = useRef()

  return (
    <div className="w-56 h-full bg-gray-50 border-r border-gray-200 flex flex-col p-3 gap-4 overflow-y-auto flex-shrink-0">

      {/* Undo / Redo */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">History</p>
        <div className="flex gap-1">
          <button
            onClick={undo}
            disabled={!history.length}
            className="flex-1 py-1.5 rounded text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >↩ Undo</button>
          <button
            onClick={redo}
            disabled={!future.length}
            className="flex-1 py-1.5 rounded text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >↪ Redo</button>
        </div>
      </div>

      {/* Tools */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tools</p>
        <div className="flex flex-col gap-1">
          {TOOL_SECTIONS[0].tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTool === tool.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
            >
              <span style={{ fontSize: 13 }}>{tool.icon}</span>
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wall hint */}
      <div className="bg-slate-100 rounded-md px-3 py-2 text-xs text-slate-500 leading-relaxed">
        Hold <span className="font-semibold text-slate-700">W</span> + drag on tile edges to draw walls.<br />
        Hold <span className="font-semibold text-slate-700">Space</span> to temporarily pan.
      </div>

      {/* Tile types — only show when paint tool active */}
      {(activeTool === 'paint' || activeTool === 'erase') && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tile Type</p>
          <div className="flex flex-col gap-1">
            {Object.values(TILE_TYPES).filter(t => t.id !== 'empty').map(tile => (
              <button
                key={tile.id}
                onClick={() => { setActiveTileType(tile.id); setActiveTool('paint') }}
                className={`flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm transition-colors
                  ${activeTileType === tile.id && activeTool === 'paint'
                    ? 'ring-2 ring-blue-500 bg-white'
                    : 'bg-white border border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <span
                  style={{ backgroundColor: tile.color }}
                  className="w-4 h-4 rounded-sm border border-black/10 flex-shrink-0"
                />
                <span className="text-gray-700 text-xs">{tile.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Node/Edge hints */}
      {activeTool === 'node' && (
        <div className="bg-blue-50 rounded-md px-3 py-2 text-xs text-blue-600 leading-relaxed">
          Click any tile to place a nav node.<br />
          Right-click a node to delete it.
        </div>
      )}
      {activeTool === 'edge' && (
        <div className="bg-purple-50 rounded-md px-3 py-2 text-xs text-purple-600 leading-relaxed">
          Click a node to select it, then click another node to connect them.<br />
          Right-click an edge to delete it.
        </div>
      )}

      {/* Save / Load */}
      <div className="mt-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Map Data</p>
        <div className="flex flex-col gap-1">
          <button
            onClick={saveToLocalStorage}
            className="px-3 py-2 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700"
          >💾 Save</button>
          <button
            onClick={() => {
              const ok = loadFromLocalStorage()
              if (!ok) alert('No saved map found.')
            }}
            className="px-3 py-2 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
          >📂 Load</button>
          <button
            onClick={exportJSON}
            className="px-3 py-2 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
          >⬇ Export JSON</button>
          <button
            onClick={() => fileRef.current.click()}
            className="px-3 py-2 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
          >⬆ Import JSON</button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={e => {
              if (e.target.files[0]) importJSON(e.target.files[0])
              e.target.value = ''
            }}
          />
        </div>
      </div>

    </div>
  )
}