import { useAppStore } from '../store/useAppStore'
import { useMapStore } from '../store/useMapStore'

export default function DashboardPage() {
  const { setPage } = useAppStore()
  const { floors } = useMapStore()

  const stats = {
    floors: floors.length,
    rooms: floors.reduce((acc, f) => acc + f.rooms.length, 0),
    nodes: floors.reduce((acc, f) => acc + f.nodes.length, 0),
    markers: floors.reduce((acc, f) => acc + f.markers.length, 0),
  }

  const cards = [
    {
      id: 'editor',
      title: 'Map Editor',
      icon: '✏️',
      desc: 'Design floor layouts, paint rooms, draw walls, and build navigation graphs.',
      bg: 'from-blue-500/20 to-blue-600/5',
      border: 'border-blue-500/30',
      disabled: false,
    },
    {
      id: 'manage-rooms',
      title: 'Manage Content',
      icon: '🏢',
      desc: 'Edit room properties, assign labels, update POI markers and set semantic types.',
      bg: 'from-emerald-500/20 to-emerald-600/5',
      border: 'border-emerald-500/30',
      disabled: false,
    },
    {
      id: 'manage-events',
      title: 'Event Management',
      icon: '📅',
      desc: 'Schedule events and link them to specific rooms or locations.',
      bg: 'from-purple-500/10 to-purple-600/5',
      border: 'border-purple-500/30',
      disabled: false,
    },
    {
      id: 'navigation',
      title: 'Routing & Navigation',
      icon: '🧭',
      desc: 'Test and manage graph-based pathfinding across the building.',
      bg: 'from-orange-500/10 to-orange-600/5',
      border: 'border-orange-500/30',
      disabled: false,
    },
    {
      id: 'preview',
      title: 'Mobile App Preview',
      icon: '📱',
      desc: 'Simulate the final mobile navigation experience for end users.',
      bg: 'from-pink-500/10 to-pink-600/5',
      border: 'border-pink-500/30',
      disabled: false,
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-5xl mx-auto mt-4">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Dashboard</h1>
          <p className="text-lg text-slate-400">Main Building Management System</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="text-3xl font-bold text-slate-200 mb-1">{value}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{key}</div>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => !card.disabled && setPage(card.id)}
              disabled={card.disabled}
              className={`text-left relative flex flex-col p-6 rounded-2xl border bg-gradient-to-br transition-all duration-300
                ${card.disabled 
                  ? `opacity-50 cursor-not-allowed ${card.border} ${card.bg}`
                  : `hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 cursor-pointer ${card.border} ${card.bg}`
                }
              `}
            >
              {card.disabled && (
                <span className="absolute top-4 right-4 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                  Coming Soon
                </span>
              )}
              <span className="text-4xl mb-5 inline-block">{card.icon}</span>
              <h3 className="text-xl font-bold text-slate-100 mb-2">{card.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed flex-1">{card.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
