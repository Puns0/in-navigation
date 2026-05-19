import Sidebar from './components/editor/SideBar'
import Grid from './components/editor/Grid'
import FloorBar from './components/editor/FloorBar'

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      
      {/* Top bar */}
      <div className="h-12 bg-gray-900 text-white flex items-center px-4 text-sm font-semibold flex-shrink-0">
        Indoor Nav — Map Editor
      </div>

      {/* Floor switcher */}
      <FloorBar />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Grid />
      </div>

    </div>
  )
}