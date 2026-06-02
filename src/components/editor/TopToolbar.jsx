import { useRef } from 'react'
import { useMapStore } from '../../store/useMapStore'

export default function TopToolbar() {
  const { undo, redo, history, future, saveToLocalStorage, exportJSON, importJSON } = useMapStore()
  const fileRef = useRef()

  return (
    <div
      className="h-12 flex items-center justify-between px-5 flex-shrink-0 border-b"
      style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
    >
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
          Indoor Nav
        </div>
        <div className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
          Map Editor
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!history.length}
          className="px-2.5 py-1.5 rounded-md text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          title="Undo (Ctrl+Z)"
        >
          ↩ Undo
        </button>
        <button
          onClick={redo}
          disabled={!future.length}
          className="px-2.5 py-1.5 rounded-md text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          title="Redo (Ctrl+Y)"
        >
          ↪ Redo
        </button>

        <div className="w-px h-5 mx-1.5" style={{ background: 'var(--border-default)' }} />

        {/* Save */}
        <button
          onClick={saveToLocalStorage}
          className="px-2.5 py-1.5 rounded-md text-xs font-semibold hover:opacity-90"
          style={{ background: 'var(--success)', color: '#fff' }}
          title="Save to browser"
        >
          💾 Save
        </button>

        {/* Export */}
        <button
          onClick={exportJSON}
          className="px-2.5 py-1.5 rounded-md text-xs font-medium hover:opacity-80"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          title="Download JSON file"
        >
          ⬇ Export
        </button>

        {/* Import */}
        <button
          onClick={() => fileRef.current.click()}
          className="px-2.5 py-1.5 rounded-md text-xs font-medium hover:opacity-80"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          title="Load JSON file"
        >
          ⬆ Import
        </button>
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
  )
}
