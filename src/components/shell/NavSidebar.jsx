import { useAppStore } from '../../store/useAppStore'

export default function NavSidebar() {
  const { currentPage, setPage, sidebarCollapsed, toggleSidebar } = useAppStore()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', disabled: false },
    { id: 'editor', label: 'Editor', icon: '✏️', disabled: false },
    { id: 'manage-rooms', label: 'Manage Rooms', icon: '🏢', disabled: false },
    { id: 'manage-events', label: 'Manage Events', icon: '📅', disabled: false },
    { id: 'navigation', label: 'Navigation', icon: '🧭', disabled: false },
    { id: 'preview', label: 'Preview', icon: '📱', disabled: false },
  ]

  return (
    <div
      className={`h-full flex flex-col flex-shrink-0 transition-all duration-200 border-r relative z-50`}
      style={{
        width: sidebarCollapsed ? '60px' : '220px',
        background: '#121a28',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => !item.disabled && setPage(item.id)}
            disabled={item.disabled}
            title={sidebarCollapsed ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[rgba(255,255,255,0.05)]'
            }`}
            style={{
              background: currentPage === item.id ? 'var(--accent)' : 'transparent',
              color: currentPage === item.id ? '#fff' : 'var(--text-secondary)',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            }}
          >
            <span className="text-lg">{item.icon}</span>
            {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
          </button>
        ))}
      </div>

      <div className="p-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-md hover:bg-[rgba(255,255,255,0.05)] text-gray-400 font-medium text-xs tracking-wider uppercase"
        >
          {sidebarCollapsed ? '»' : '« Collapse'}
        </button>
      </div>
    </div>
  )
}
