import { useMapStore } from '../../store/useMapStore'

export default function FloorBar() {
  const { floors, activeFloorId, setActiveFloor } = useMapStore()

  // Ascending: Basement 2, Basement 1, Ground, Floor 1, Floor 2
  const sorted = [...floors].sort((a, b) => a.id - b.id)

  return (
    <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto flex-shrink-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2 flex-shrink-0">
        Floors
      </span>
      {sorted.map(floor => (
        <button
          key={floor.id}
          onClick={() => setActiveFloor(floor.id)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors flex-shrink-0
            ${activeFloorId === floor.id
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
        >
          {floor.label}
        </button>
      ))}
    </div>
  )
}