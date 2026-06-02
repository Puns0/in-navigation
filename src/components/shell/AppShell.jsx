import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import NavSidebar from './NavSidebar'

export default function AppShell({ children }) {
  const { currentPage, setSidebarCollapsed } = useAppStore()

  // Auto-collapse sidebar when Editor is active to maximize workspace
  useEffect(() => {
    if (currentPage === 'editor') {
      setSidebarCollapsed(true)
    } else {
      setSidebarCollapsed(false)
    }
  }, [currentPage, setSidebarCollapsed])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Top Bar */}
      <div 
        className="h-12 flex items-center px-5 flex-shrink-0 border-b relative z-40" 
        style={{ background: '#0d131f', borderColor: 'var(--border-default)' }}
      >
        <div className="text-sm font-bold tracking-wide flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <div className="flex items-center justify-center w-6 h-6 rounded bg-blue-500 text-white font-bold text-xs">IN</div>
          Indoor Nav Admin
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
            Main Building
          </span>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        <NavSidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  )
}
