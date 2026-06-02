import { useEffect } from 'react'
import { useMapStore } from './store/useMapStore'
import { useAppStore } from './store/useAppStore'
import AppShell from './components/shell/AppShell'
import DashboardPage from './pages/DashboardPage'
import EditorPage from './pages/EditorPage'
import ManageRoomsPage from './pages/ManageRoomsPage'
import ManageEventsPage from './pages/ManageEventsPage'
import NavigationPage from './pages/NavigationPage'
import MobileAppPage from './pages/mobile/MobileAppPage'

export default function App() {
  const { loadFromLocalStorage } = useMapStore()
  const { currentPage } = useAppStore()

  // Load saved data on initial mount
  useEffect(() => {
    loadFromLocalStorage()
    loadFromLocalStorage()
  }, [])

  if (currentPage === 'preview') {
    return <MobileAppPage />
  }

  return (
    <AppShell>
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'editor' && <EditorPage />}
      {currentPage === 'manage-rooms' && <ManageRoomsPage />}
      {currentPage === 'manage-events' && <ManageEventsPage />}
      {currentPage === 'navigation' && <NavigationPage />}
    </AppShell>
  )
}